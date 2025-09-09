import { v1 } from '@google-cloud/pubsub';

import { ChannelFactory } from './shared/channelFactory';

const subscriptionName =
  'projects/mymusic-434611/subscriptions/notification-sub';

async function main(): Promise<void> {
  const client = new v1.SubscriberClient();
  let hasMessages = true;

  while (hasMessages) {
    const request = {
      subscription: subscriptionName,
      maxMessages: 10,
    };

    const [response] = await client.pull(request);
    console.log('Response: ', response[0]);
    const messages = response.receivedMessages || [];
    console.log('messages: ', messages);
    if (messages.length === 0) {
      hasMessages = false;
      break;
    }

    const ackIds: string[] = [];

    for (const receivedMessage of messages) {
      const message = receivedMessage.message;
      if (!message?.data) continue;

      try {
        const data = JSON.parse(Buffer.from(message.data).toString());
        const notifyBy = data.query.notifyBy || [];
        const userId = data.query.uid;
        const notification = {
          userId,
          message: `New result: ${data.results.snippet?.title ?? ''}`,
          notifyBy,
        };

        for (const channelType of notification.notifyBy) {
          const channel = ChannelFactory.getChannel(channelType);
          await channel.sendNotification(
            notification.userId,
            notification.message
          );
        }

        ackIds.push(receivedMessage.ackId!);
      } catch {
        // Optionally handle failed messages here
      }
    }

    if (ackIds.length > 0) {
      await client.acknowledge({
        subscription: subscriptionName,
        ackIds,
      });
    }
  }

  process.exit(0);
}

main();
