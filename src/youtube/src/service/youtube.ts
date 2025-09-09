import { youtube_v3 } from '@googleapis/youtube';
import { GoogleAuth } from 'google-auth-library';
import { PubSub } from '@google-cloud/pubsub';

import DatastoreClient from '../utils/dsClient';
import { getRelevantQueries } from '../utils/filter';
import { Platform, SingleQuery } from '../types/query';
import { MessageOptions } from '@google-cloud/pubsub/build/src/topic';
import { filterYoutubeResultsWithGemini } from '../utils/geminiClient';

class YoutubeClient {
  private serviceAccountKeyFile: string | undefined;
  private youtube: youtube_v3.Youtube | null = null;
  private pubsub: PubSub;

  constructor() {
    this.serviceAccountKeyFile = process.env.YOUTUBE_KEY_FILE;
    this.initializeYouTubeClient();
    this.pubsub = new PubSub();
  }

  async initializeYouTubeClient() {
    const auth = new GoogleAuth({
      keyFile: this.serviceAccountKeyFile,
      scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
    });

    const client = (await auth.getClient()) as any;
    this.youtube = new youtube_v3.Youtube({
      auth: client,
    });
  }

  async initSearch() {
    const queries = await this.getQueries();
    const relevantQueries = getRelevantQueries(queries);

    for (const query of relevantQueries) {
      const aiUserPrompt = query.aiUserPrompt ?? '';
      const result = await this.searchYouTube(query.term, aiUserPrompt);

      if (result && result.id && result.id.videoId !== query.lastResult) {
        console.log('New result found, publishing to Pub/Sub...', result);
        //publish new-results event to PubSub
        await this.publishSearchResults(result, 'new-results', query);
      }
    }
  }

  async searchYouTube(
    query: string,
    aiUserPrompt: string,
    maxResults: number = 5
  ) {
    if (!this.youtube) {
      console.error('YouTube client is not initialized yet');
      return;
    }
    try {
      const searchResults = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        order: 'relevance',
        maxResults: maxResults,
        type: ['video'],
      });

      const items = searchResults.data.items || [];
      const relevantIndexes = await filterYoutubeResultsWithGemini(
        query,
        aiUserPrompt,
        items
      );

      const filteredResults = relevantIndexes
        .map((idx: number) => items[idx])
        .filter(Boolean);

      const sortedResults = this.sortResultsByPublishedAt(filteredResults);
      return sortedResults[0];
    } catch (error) {
      console.error('Error searching YouTube:', error);
    }
  }

  private sortResultsByPublishedAt(results: any[]): any[] {
    return results.slice().sort((a, b) => {
      const aDate = new Date(a.snippet?.publishedAt ?? 0).getTime();
      const bDate = new Date(b.snippet?.publishedAt ?? 0).getTime();
      return bDate - aDate;
    });
  }

  private async getQueries() {
    const dsClient = DatastoreClient.getInstance();

    const queries: SingleQuery[] = await dsClient.getEntities('Query', {
      key: 'platform',
      operator: '=',
      value: Platform.YOUTUBE,
    });

    return queries;
  }

  private async publishSearchResults(
    results: any,
    topicName: string,
    query: SingleQuery
  ) {
    try {
      const topic = this.pubsub.topic(topicName);
      const data = {
        query,
        results,
        timestamp: new Date().toISOString(),
      };

      const dataBuffer = Buffer.from(JSON.stringify(data));
      const message: MessageOptions = {
        data: dataBuffer,
      };

      await topic.publishMessage(message);

      console.log(`Search results published to topic ${topicName}`);
    } catch (error) {
      console.error('Error publishing to Pub/Sub:', error);
    }
  }
}

export default YoutubeClient;
