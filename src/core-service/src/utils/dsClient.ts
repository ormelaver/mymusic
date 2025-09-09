import { Datastore } from '@google-cloud/datastore';
import { SingleQuery } from '../types/query';

class DatastoreClient {
  private static instance: DatastoreClient;
  private datastore: Datastore;

  // Private constructor to prevent direct instantiation
  private constructor() {
    this.datastore = new Datastore({
      databaseId: 'mymusic',
    });
  }

  // Method to get the singleton instance of the DatastoreClient
  public static getInstance(): DatastoreClient {
    if (!DatastoreClient.instance) {
      DatastoreClient.instance = new DatastoreClient();
    }
    return DatastoreClient.instance;
  }

  // CRUD operations
  public async saveEntities(kind: string, data: any): Promise<SingleQuery[]> {
    const { uid, queries } = data;

    const entities = queries.map((query: Record<string, any>) => {
      const queryKey = this.datastore.key(['Query', `${uid}-${query.name}`]);

      return {
        key: queryKey,
        data: {
          ...query,
          uid,
        },
      };
    });
    console.log('Saving entities to Datastore:', entities);
    try {
      await this.datastore.save(entities);
      console.log(
        `${data.queries.length} entity(ies) of kind ${kind} saved successfully.`
      );
      return data.queries;
    } catch (error: any) {
      throw error;
    }
  }

  public async getEntity(kind: string, name: string) {
    const key = this.datastore.key([kind, name]);
    const entity = await this.datastore.get(key);
    return entity;
  }
}

export default DatastoreClient;
