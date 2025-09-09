import { BaseChannel } from './baseChannel';
// import { EmailChannel } from './EmailChannel';
import { SmsChannel } from '../channels/sms';

export class ChannelFactory {
  static getChannel(channelType: string): BaseChannel {
    switch (channelType.toUpperCase()) {
      //   case 'EMAIL':
      //     return new EmailChannel();
      case 'SMS':
        return new SmsChannel();
      // Add more channels here
      default:
        throw new Error(`Unsupported channel type: ${channelType}`);
    }
  }
}
