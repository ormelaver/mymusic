import { BaseChannel } from '../shared/baseChannel';
import { TwilioClient } from '../utils/twilio';
import { getAuth } from 'firebase-admin/auth';

export class SmsChannel implements BaseChannel {
  private client: TwilioClient;

  constructor() {
    this.client = TwilioClient.getInstance();
  }

  async sendNotification(uid: string, message: string): Promise<void> {
    // Retrieve user's phone number from Firebase Auth
    const userRecord = await getAuth().getUser(uid);
    const toPhone = userRecord.phoneNumber;

    if (!toPhone) {
      throw new Error('Recipient phone number not found for user');
    }

    await this.client.sendMessage({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhone,
    });
  }
}
