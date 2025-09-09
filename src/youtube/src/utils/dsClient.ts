const { Datastore, RunQueryResponse } = require('@google-cloud/datastore');
import EntityFilter from '@google-cloud/datastore';

import { Platform, SingleQuery } from '../types/query';

class DatastoreClient {
  private static instance: DatastoreClient;
  private datastore;

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

  public async getEntities(
    kind: string,
    filter: { key: string; operator: string; value: string }
  ): Promise<any> {
    const query = this.datastore
      .createQuery(kind)
      .filter(filter.key, filter.operator, filter.value);
    const [entites] = await this.datastore.runQuery(query);
    return entites;
  }

  public async getEntity(kind: string, name: string) {
    const key = this.datastore.key([kind, name]);
    const entity = await this.datastore.get(key);
    return entity;
  }
}

export default DatastoreClient;
