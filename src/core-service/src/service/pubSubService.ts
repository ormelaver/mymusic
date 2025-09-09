import DatastoreClient from '../utils/dsClient';
import { addDays } from 'date-fns';
import { PubSubMessage } from '../types/query';

class PubSubService {
  async handlePubSubMessage(pubsubMessage: { data: string }): Promise<any> {
    const decodedData = Buffer.from(pubsubMessage.data, 'base64').toString(
      'utf8'
    );

    try {
      const messageData = JSON.parse(decodedData);
      if (!this.isValidPubSubMessage(messageData)) {
        throw new Error('Invalid message format');
      }

      const { query, results, timestamp }: PubSubMessage = messageData;
      const nextRunDate = addDays(new Date(timestamp), query.interval);

      const updatedQuery = {
        ...query,
        lastResult: results.id!.videoId,
        nextRun: nextRunDate.toISOString(),
      };

      const dsClient = DatastoreClient.getInstance();
      await dsClient.saveEntities('Query', {
        uid: query.uid,
        queries: [updatedQuery],
      });

      return updatedQuery;
    } catch (error: any) {
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
      !messageData.results ||
      !messageData.results.id ||
      !messageData.results.id.videoId ||
      typeof messageData.results.id.videoId !== 'string' ||
      !messageData.timestamp
    ) {
      return false;
    }
    return true;
  }
}

export default new PubSubService();
