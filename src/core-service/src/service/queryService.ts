import DatastoreClient from '../utils/dsClient';
import { SingleQuery, Notifictions } from '../types/query';
import { getAuth } from 'firebase-admin/auth';

class QueryService {
  private datastoreClient: DatastoreClient;
  constructor() {
    this.datastoreClient = DatastoreClient.getInstance();
  }

  async addQueries(
    uid: string,
    queries: SingleQuery[]
  ): Promise<SingleQuery[] | object> {
    try {
      const queriesToSave: SingleQuery[] = [];
      for (let i = 0; i < queries.length; i++) {
        const currentQuery = queries[i];
        const verification = await this.verifyQuery(uid, currentQuery);
        if (verification.status) {
          currentQuery.nextRun = this.setNextSearch();
          queriesToSave.push(currentQuery);
        } else {
          console.warn(
            `Query '${currentQuery.name}' not added: ${verification.message}`
          );
        }
      }

      if (queriesToSave.length > 0) {
        const addedQueries = await this.datastoreClient.saveEntities('Query', {
          uid,
          queries: queriesToSave,
        });
        return addedQueries;
      } else {
        return { message: 'No new queries to add' };
      }
    } catch (error) {
      throw error;
    }
  }

  private setNextSearch() {
    const now = new Date();

    // Set the fixed time (e.g., 14:30:00)
    const fixedHour = 21;
    const fixedMinutes = 0;
    const fixedSeconds = 0;

    // Create a new Date object with the same year, month, and day as today
    const customDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      fixedHour,
      fixedMinutes,
      fixedSeconds
    );

    return customDate.toISOString();
  }

  private async verifyQuery(
    uid: string,
    currentQuery: SingleQuery
  ): Promise<{ status: boolean; message: string }> {
    const isQueryExist = await this.datastoreClient.getEntity(
      'Query',
      `${uid}-${currentQuery.name}`
    );
    if (isQueryExist[0] !== undefined) {
      return {
        status: false,
        message: `Query '${currentQuery.name}' already exists.`,
      };
    }
    if (
      Array.isArray(currentQuery.notifyBy) &&
      currentQuery.notifyBy.includes(Notifictions.SMS)
    ) {
      try {
        const userRecord = await getAuth().getUser(uid);
        if (!userRecord.phoneNumber) {
          return {
            status: false,
            message:
              'SMS notifications requested, but no phone number found for user.',
          };
        }
      } catch (error) {
        return {
          status: false,
          message: 'Error verifying user phone number.',
        };
      }
    }

    return { status: true, message: 'Query is valid' };
  }
}

export default new QueryService();
