export interface Taste {
  uid: string;
  tastePos: PositivTasteVector[];
  tasteNeg: NegativeTasteVector | null;
  modelId: string;
  dim: number;
  createdAt: string;
  updatedAt: string;
}

export interface PositivTasteVector {
  id: string;
  vec: number[];
  alpha: number;
  updatedAt: number;
}

export interface NegativeTasteVector {
  vec: number[];
  gamma: number;
  updatedAt: number;
}

export enum QueryInterval {
  DAY = 1,
  WEEK = 7,
  MONTH = 30,
}

export enum Platform {
  SOUNDCLOUD = 'SOUNDCLOUD',
  YOUTUBE = 'YOUTUBE',
}

export interface SingleQuery {
  name: string;
  term: string;
  interval: QueryInterval;
  platform: Platform;
  lastResult: string;
  durationFrom?: number;
  durationTo?: number;
  nextRun?: string;
}

export interface YoutubeSearchResult {
  kind: string;
  etag: string;
  id: { kind: string; videoId: string };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: object[]; // unused here
    channelTitle: string;
    liveBroadcastContent: string;
    publishTime: string;
  };
}

export interface PubSubMessageCandidates {
  uid: string;
  query: SingleQuery;
  candidates: FilteredResult[];
}

export interface FilteredResult {
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
  publishedAt?: string;
}
