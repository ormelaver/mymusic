// services/userTasteService.ts
// Orchestrates Datastore <-> teiMath. Keeps business logic thin.
import { PubSub } from '@google-cloud/pubsub';
import DsClient from '../utils/dsClient';
import {
  SingleQuery,
  Taste,
  YoutubeSearchResult,
  PubSubMessageCandidates,
} from '../types/taste';
import {
  rankYouTubeResults,
  updateTasteUsingQuery,
  TasteVectors,
  RankedResult,
} from '../utils/teiMath';
import { MessageOptions } from '@google-cloud/pubsub/build/src/topic';

const DEFAULT_MODEL_ID =
  process.env.MODEL_ID ?? 'sentence-transformers/all-MiniLM-L6-v2';
const DEFAULT_DIM = parseInt(process.env.EMBED_DIM ?? '384', 10);

class UserTasteService {
  private ds: DsClient;
  private pubsub: PubSub;

  constructor() {
    this.ds = DsClient.getInstance();
    this.pubsub = new PubSub();
  }

  async createTaste(pubsubMessage: { data: string }) {
    try {
      const decodedData = Buffer.from(pubsubMessage.data, 'base64').toString(
        'utf8'
      );
      const messageData = JSON.parse(decodedData);
      const uid = messageData.uid;
      if (!uid) throw new Error('uid is required');

      const taste: Taste = {
        uid,
        tastePos: [],
        tasteNeg: null,
        modelId: DEFAULT_MODEL_ID,
        dim: DEFAULT_DIM,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.ds.saveTaste(uid, taste);
      return taste;
    } catch (error) {
      console.error('Error creating taste:', error);
      throw new Error('Failed to create taste');
    }
  }

  // 2) /update (PATCH) { uid: string, queryId: string, action: 'like' | 'dislike' }
  async updateTaste(data: {
    uid: string;
    queryId: string;
    action: 'like' | 'dislike';
  }) {
    const { uid, queryId, action } = data || {};
    if (!uid || !queryId || !action) {
      throw new Error('uid, queryId, and action are required');
    }

    // load taste + query
    const [existing, query] = await Promise.all([
      this.ds.getEntity('UserTaste', uid),
      this.ds.getEntity('Query', queryId),
    ]);

    if (!existing) throw new Error('Taste not found');
    if (!query) throw new Error('Query not found');

    // current vectors
    const tasteVectors = {
      tastePos: existing.tastePos || [],
      tasteNeg: existing.tasteNeg || null,
    };

    // compute updated vectors via teiMath
    const updatedVectors = await updateTasteUsingQuery({
      taste: tasteVectors,
      action,
      query: query[0],
    });

    // persist
    const updatedTaste: Taste = {
      ...existing,
      tastePos: updatedVectors.tastePos,
      tasteNeg: updatedVectors.tasteNeg ?? null,
      updatedAt: new Date().toISOString(),
    };

    await this.ds.saveTaste(uid, updatedTaste);
    // Publish to PubSub: { uid, queryId, action, updatedTaste }
    await this.publishSearchResults('taste-updated', {
      uid,
      queryId,
      action,
      updatedTaste,
    });
    return updatedTaste;
  }

  // 3) /rank (POST) { uid: string, queryId: string, candidates: YoutubeSearchResult[] }
  async rank(pubsubMessage: { data: string }): Promise<any> {
    try {
      console.log('****RANK pubsubMessage (service):', pubsubMessage);
      const decodedData = Buffer.from(pubsubMessage.data, 'base64').toString(
        'utf8'
      );
      console.log('****RANK REQ BODY (service):', decodedData);
      const messageData = JSON.parse(decodedData);
      // if (!this.isValidPubSubMessage(messageData)) {
      //   throw new Error('Invalid message format');
      // }

      const { uid, query, candidates }: PubSubMessageCandidates = messageData;
      console.log('****RANK uid, query, candidates:', uid, query, candidates);
      if (!uid || !query || !Array.isArray(candidates)) {
        throw new Error('uid, query, and candidates are required');
      }

      const [taste] = await this.ds.getEntity('UserTaste', uid);
      console.log('****TASTE:', taste);
      if (!taste) throw new Error('Taste not found');
      if (!query || !query.term) {
        throw new Error('Query not found or missing term');
      }

      const tasteVectors: TasteVectors = {
        tastePos: taste.tastePos || [],
        tasteNeg: taste.tasteNeg || null,
      };

      const ranked = await rankYouTubeResults({
        queryText: query.term,
        candidates,
        taste: tasteVectors,
      });
      //publish to PubSub: {query, ranked}
      await this.publishSearchResults('ranked-results', {
        query,
        candidates: ranked,
      });
      console.log(
        'Ranking result:',
        JSON.stringify({
          query,
          candidates: ranked,
        })
      );
      // top 5 are already enforced in teiMath, but keep explicit:
      return { ranked: ranked.slice(0, 5) };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  private async publishSearchResults(
    topicName: string,
    publishData: Record<string, any>
  ) {
    try {
      const topic = this.pubsub.topic(topicName);
      const data = {
        ...publishData,
        timestamp: new Date().toISOString(),
      };

      console.log('Publishing search results (data):', JSON.stringify(data));
      const dataBuffer = Buffer.from(JSON.stringify(data));
      const message: MessageOptions = {
        data: dataBuffer,
      };

      console.log(
        'Publishing search results (message):',
        JSON.stringify(message)
      );
      await topic.publishMessage(message);

      console.log(`Search results published to topic ${topicName}`);
    } catch (error) {
      console.error('Error publishing to Pub/Sub:', error);
    }
  }

  private isValidPubSubMessage(messageData: any): boolean {
    if (
      !messageData ||
      !messageData.query ||
      typeof messageData.query.interval !== 'number' ||
      !messageData.query.name ||
      !messageData.query.nextRun ||
      !messageData.query.platform ||
      !messageData.query.term ||
      !messageData.query.uid ||
      !messageData.candidates ||
      // !messageData.candidates[0].id ||
      // !messageData.candidates[0].id.videoId ||
      // typeof messageData.candidates[0].id.videoId !== 'string' ||
      !messageData.timestamp
    ) {
      return false;
    }
    return true;
  }
}

export default new UserTasteService();
