import { Key } from '@google-cloud/datastore';

export enum QueryInterval {
  DAY = 1,
  WEEK = 7,
  MONTH = 30,
}

export enum Platform {
  SOUNDCLOUD = 'SOUNDCLOUD',
  YOUTUBE = 'YOUTUBE',
}

export enum Notifictions {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export interface UserQueries {
  uid: string;
  queries: SingleQuery[];
}

export interface SingleQuery {
  uid?: string;
  name: string;
  notifyBy: Notifictions[];
  term: string;
  interval: QueryInterval;
  platform: Platform;
  lastResult: string;
  aiUserPrompt?: string;
  durationFrom?: number;
  durationTo?: number;
  nextRun?: string;
}

export interface DSEntity {
  key: Key;
  data: UserQueries;
}

interface YoutubeSearchResult {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    thumbnails: object[];
    channelTitle: string;
    liveBroadcastContent: string;
    publishTime: string;
  };
}

export interface PubSubMessage {
  query: SingleQuery;
  results: YoutubeSearchResult;
  timestamp: string;
}
