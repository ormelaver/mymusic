// utils/teiMath.ts
// All ranking + update math and TEI calls live here.
import { FilteredResult } from '../types/taste';
export type Embedding = number[];

export interface TasteVectors {
  tastePos: Embedding[]; // normalized vectors (0..k)
  tasteNeg?: Embedding | null; // normalized or null
}

export interface RankedResult {
  candidate: FilteredResult; // e.g., YouTube videoId
  score: number;
}

export interface SavedQuery {
  id: string;
  searchTerm?: string;
  // We expect the item the user reacted to stored here
  // (match your Datastore schema if the field name differs)
  lastResult?: any; // may contain { id, snippet, text?, embedding? }
}

// ---------- config ----------

const TEI_BASE_URL = process.env.TEI_BASE_URL!;
const TEI_BEARER = process.env.TEI_BEARER ?? ''; // bearer only if your TEI is private
const EMBED_BATCH_SIZE = parseInt(process.env.EMBED_BATCH_SIZE ?? '64', 10);

// Scoring knobs (env-overridable)
const LAMBDA_QUERY = parseFloat(process.env.LAMBDA_QUERY ?? '0.60');
const MU_NEGATIVE = parseFloat(process.env.MU_NEGATIVE ?? '0.30');
const SCORE_THRESHOLD = parseFloat(process.env.SCORE_THRESHOLD ?? '0.4');
const TOP_N = parseInt(process.env.TOP_N ?? '5', 10);

// Update knobs (env-overridable)
const ALPHA_POS = parseFloat(process.env.ALPHA_POS ?? '0.20'); // like step
const GAMMA_NEG = parseFloat(process.env.GAMMA_NEG ?? '0.20'); // dislike step
const BETA_PUSH = parseFloat(process.env.BETA_PUSH_AWAY ?? '0.10'); // push-away along disliked dir

// ---------- math helpers ----------

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
function l2(a: number[]): number {
  return Math.sqrt(dot(a, a));
}

export function normalize(v: number[]): number[] {
  const n = l2(v);
  if (!isFinite(n) || n === 0) return v.map(() => 0);
  const inv = 1 / n;
  return v.map((x) => x * inv);
}

function cosineNorm(a: number[], b: number[]): number {
  // assumes a,b normalized
  return dot(a, b);
}

function freshnessBonus(publishedAt?: string): number {
  if (!publishedAt) return 0;
  const t = Date.parse(publishedAt);
  if (Number.isNaN(t)) return 0;
  const ageDays = (Date.now() - t) / (1000 * 60 * 60 * 24);
  const maxBonus = 0.05;
  const bonus = maxBonus * (1 - ageDays / 14);
  return Math.max(0, Math.min(maxBonus, bonus));
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function bestPositiveSim(
  tastePos: Embedding[],
  cand: Embedding,
  fallback: number
): number {
  if (!tastePos || tastePos.length === 0) return fallback;
  let best = -Infinity;
  for (const t of tastePos) {
    const s = cosineNorm(t, cand);
    if (s > best) best = s;
  }
  return best;
}

// ---------- TEI client ----------

export async function embedTexts(inputs: string[]): Promise<Embedding[]> {
  if (!TEI_BASE_URL) throw new Error('TEI_BASE_URL is not set');
  const res = await fetch(`${TEI_BASE_URL}/embed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TEI_BEARER ? { Authorization: `Bearer ${TEI_BEARER}` } : {}),
    },
    body: JSON.stringify({ inputs }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`TEI /embed ${res.status}: ${body}`);
  }
  const json = (await res.json()) as number[][];
  if (!Array.isArray(json) || (json.length > 0 && !Array.isArray(json[0]))) {
    throw new Error('Unexpected /embed response');
  }
  return json;
}

export async function embedText(input: string): Promise<number[]> {
  const [v] = await embedTexts([input]);
  return v;
}

// ---------- YouTube helpers ----------

function youtubeResultToText(r: FilteredResult): string {
  const title = r.title ?? '';
  const channelTitle = r.channelTitle ?? '';
  const description = r.description ?? '';
  return `YouTube | ${channelTitle} | ${title} | ${description}`.trim();
}

function youtubeResultToTextSafe(r: any): string | undefined {
  try {
    const title = r?.snippet?.title ?? '';
    const channel = r?.snippet?.channelTitle ?? '';
    const videoId = r?.id?.videoId ?? '';
    if (!title && !channel && !videoId) return undefined;
    return `YouTube | ${channel} | ${title}`.trim();
  } catch {
    return undefined;
  }
}

function genericTextFromResult(r: any): string | undefined {
  const title = r?.title ?? r?.name ?? '';
  const channel = r?.channelTitle ?? r?.author ?? r?.channel ?? '';
  const platform = r?.platform ?? '';
  const s = [platform || 'Item', channel, title].filter(Boolean).join(' | ');
  return s || undefined;
}

// ---------- Ranking (YouTube) ----------

export async function rankYouTubeResults(args: {
  queryText: string;
  candidates: FilteredResult[];
  taste: TasteVectors;
}): Promise<RankedResult[]> {
  const { queryText, candidates, taste } = args;

  // query embedding
  const [qRaw] = await embedTexts([queryText]);
  const q = normalize(qRaw);

  // console.log('Query embedding:', q);
  // candidate embeddings (batched)
  const texts = candidates.map(youtubeResultToText);
  const candVecs: Embedding[] = new Array(texts.length);
  let offset = 0;
  for (const part of chunk(texts, EMBED_BATCH_SIZE)) {
    const vecs = await embedTexts(part);
    // console.log('Candidate embeddings batch:', vecs);
    for (let i = 0; i < vecs.length; i++) {
      candVecs[offset + i] = normalize(vecs[i]);
    }
    offset += part.length;
  }

  const tastePos = (taste.tastePos ?? []).map(normalize);
  const tasteNeg = taste.tasteNeg ? normalize(taste.tasteNeg) : null;

  const scored: RankedResult[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    const v = candVecs[i];

    const sQuery = cosineNorm(q, v);
    const sPos = bestPositiveSim(tastePos, v, sQuery);
    const sNeg = tasteNeg ? cosineNorm(tasteNeg, v) : 0;
    let sFresh = 0;
    if (cand.publishedAt) {
      sFresh = freshnessBonus(cand.publishedAt);
    }

    const score =
      LAMBDA_QUERY * sQuery +
      (1 - LAMBDA_QUERY) * sPos -
      MU_NEGATIVE * sNeg +
      sFresh;

    if (score >= SCORE_THRESHOLD) {
      scored.push({ candidate: candidates[i], score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, TOP_N);
}

// ---------- Taste updates ----------

function pickClosest(clusters: Embedding[], vec: Embedding): number {
  if (!clusters || clusters.length === 0) return -1;
  let bestI = 0,
    bestS = -Infinity;
  for (let i = 0; i < clusters.length; i++) {
    const s = cosineNorm(clusters[i], vec);
    if (s > bestS) {
      bestS = s;
      bestI = i;
    }
  }
  return bestI;
}

export const TeiMath = {
  /**
   * Update taste vectors with a single feedback event.
   * - like: update the closest positive cluster via EMA
   * - dislike: update negative EMA (+ optional push-away on closest positive)
   */
  updateTaste(args: {
    embedding: Embedding; // raw or normalized
    taste: TasteVectors; // current vectors
    action: 'like' | 'dislike';
  }): TasteVectors {
    const v = normalize(args.embedding);
    const tastePos = (args.taste.tastePos ?? []).map(normalize);
    const tasteNeg = args.taste.tasteNeg
      ? normalize(args.taste.tasteNeg)
      : null;

    if (args.action === 'like') {
      if (tastePos.length === 0) {
        return { tastePos: [v], tasteNeg };
      } else {
        const i = pickClosest(tastePos, v);
        const t = tastePos[i];
        const updated = normalize(
          t.map((x, k) => (1 - ALPHA_POS) * x + ALPHA_POS * v[k])
        );
        tastePos[i] = updated;
        return { tastePos, tasteNeg };
      }
    }

    // dislike:
    let nextNeg: Embedding;
    if (!tasteNeg) {
      nextNeg = v.slice();
    } else {
      nextNeg = normalize(
        tasteNeg.map((x, k) => (1 - GAMMA_NEG) * x + GAMMA_NEG * v[k])
      );
    }

    if (BETA_PUSH > 0 && tastePos.length > 0) {
      const i = pickClosest(tastePos, v);
      if (i !== -1) {
        const t = tastePos[i];
        const projMag = cosineNorm(t, v); // dot since normalized
        const updated = normalize(
          t.map((x, k) => x - BETA_PUSH * projMag * v[k])
        );
        tastePos[i] = updated;
      }
    }

    return { tastePos, tasteNeg: nextNeg };
  },
};

/**
 * Update taste using a SavedQuery that contains the item the user reacted to.
 * - Resolves the item's embedding from query.lastResult.embedding or builds text and calls TEI.
 * - Delegates update math to TeiMath.updateTaste.
 */
export async function updateTasteUsingQuery(args: {
  taste: TasteVectors;
  action: 'like' | 'dislike';
  query: SavedQuery;
}): Promise<TasteVectors> {
  const { taste, action, query } = args;
  if (!query?.lastResult) {
    throw new Error('Query has no lastResult to apply feedback to');
  }

  const cand = query.lastResult;
  let embedding: number[] | undefined = Array.isArray(cand.embedding)
    ? cand.embedding
    : undefined;

  if (!embedding) {
    const text =
      cand.text ?? youtubeResultToTextSafe(cand) ?? genericTextFromResult(cand);

    if (!text) {
      throw new Error('Cannot derive text for embedding from query.lastResult');
    }
    const [vec] = await embedTexts([text]);
    embedding = vec;
  }

  return TeiMath.updateTaste({ embedding, taste, action });
}
