import { Datastore } from '@google-cloud/datastore';

class DsClient {
  private static instance: DsClient;
  private datastore: Datastore;

  private constructor() {
    this.datastore = new Datastore({ databaseId: 'mymusic' });
  }

  public static getInstance(): DsClient {
    if (!DsClient.instance) {
      DsClient.instance = new DsClient();
    }
    return DsClient.instance;
  }

  public async saveTaste(userId: string, taste: any): Promise<void> {
    const key = this.datastore.key(['UserTaste', userId]);
    try {
      await this.datastore.save({ key, data: taste });
    } catch (error: any) {
      console.error('Error saving taste:', error);
    }
  }

  public async getEntity(kind: string, name: string): Promise<any> {
    try {
      const key = this.datastore.key([kind, name]);
      console.log('Datastore key:', key);
      const entity = await this.datastore.get(key);
      console.log('Datastore entity:', entity);
      return entity;
    } catch (error: any) {
      console.error('Error getting entity:', error.message);
      throw error;
    }
  }
}

export default DsClient;
