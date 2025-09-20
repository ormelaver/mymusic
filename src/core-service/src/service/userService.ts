import * as admin from 'firebase-admin';
import axios from 'axios';
import { PubSub } from '@google-cloud/pubsub';
import { UserData } from '../types/user';

class UserService {
  private firebaseApiKey = process.env.FIREBASE_API_KEY || '';
  constructor() {}

  async addUser(userData: UserData): Promise<admin.auth.UserRecord> {
    try {
      const createUserData: admin.auth.CreateRequest = {
        email: userData.email,
        password: userData.password,
        emailVerified: false,
      };

      if (userData.phoneNumber) {
        createUserData.phoneNumber = userData.phoneNumber;
      }

      const addedUser = await admin.auth().createUser(createUserData);

      // Publish event to PubSub 'new-user-added' topic
      await this.publishMessage('new-user-added', {
        uid: addedUser.uid,
        createdAt: new Date().toISOString(),
      });

      return addedUser;
    } catch (error) {
      throw error;
    }
  }

  async login(email: string, password: string): Promise<string> {
    if (!this.firebaseApiKey) {
      throw new Error('Firebase API key is not set');
    }
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.firebaseApiKey}`;

    try {
      const response = await axios.post(url, {
        email,
        password,
        returnSecureToken: true,
      });

      const token = response.data.idToken;
      return token;
    } catch (error) {
      throw new Error('Login failed');
    }
  }

  private async publishMessage(
    topicName: string,
    payload: Record<string, any>
  ) {
    const pubsub = new PubSub();
    const topic = pubsub.topic(topicName);
    const dataBuffer = Buffer.from(JSON.stringify(payload));
    await topic.publishMessage({ data: dataBuffer });
  }
}

export default new UserService();
