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

export interface FilteredResult {
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
  publishedAt?: string;
}
