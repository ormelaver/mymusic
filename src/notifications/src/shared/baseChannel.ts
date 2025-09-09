export interface BaseChannel {
  sendNotification(uid: string, message: string): Promise<void>;
}
