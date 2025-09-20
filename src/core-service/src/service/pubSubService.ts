import DatastoreClient from '../utils/dsClient';
import { addDays } from 'date-fns';
import { PubSubMessage, SingleQuery } from '../types/query';

class PubSubService {
  async handlePubSubMessage(pubsubMessage: { data: string }): Promise<any> {
    try {
      const decodedData = Buffer.from(pubsubMessage.data, 'base64').toString(
        'utf8'
      );
      const messageData = JSON.parse(decodedData);
      console.log('Parsed Pub/Sub message data:', JSON.stringify(messageData));
      if (!this.isValidPubSubMessage(messageData)) {
        throw new Error('Invalid message format');
      }

      const { query, candidates, timestamp }: PubSubMessage = messageData;
      const nextRunDate = addDays(new Date(timestamp), query.interval);

      const updatedQuery: SingleQuery = {
        ...query,
        nextRun: nextRunDate.toISOString(),
      };

      console.log('Updated query:', updatedQuery);
      if (query.lastResult.videoId !== candidates[0].candidate.videoId) {
        updatedQuery.lastResult = {
          videoId: candidates[0].candidate.videoId,
          title: candidates[0].candidate.title,
          channelTitle: candidates[0].candidate.channelTitle,
          description: candidates[0].candidate.description,
          publishedAt: candidates[0].candidate.publishedAt ?? '',
        };
      }
      const dsClient = DatastoreClient.getInstance();
      await dsClient.saveEntities('Query', {
        uid: query.uid,
        queries: [updatedQuery],
      });

      return updatedQuery;
    } catch (error: any) {
      console.error('Error handling Pub/Sub message:', error.message);
      throw new Error(error);
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

export default new PubSubService();
