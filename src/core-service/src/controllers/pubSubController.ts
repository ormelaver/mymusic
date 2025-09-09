import { Request, Response } from 'express';
import PubSubService from '../service/pubSubService';

class PubSubController {
  async handlePubSubMessage(req: Request, res: Response): Promise<void> {
    try {
      const pubsubMessage = req.body.message;
      if (!pubsubMessage || !pubsubMessage.data) {
        res.status(400).json({
          status: 'error',
          message: 'Missing Pub/Sub message data',
          data: null,
        });
        return;
      }

      const result = await PubSubService.handlePubSubMessage(pubsubMessage);

      res.status(200).json({
        status: 'success',
        message: 'Message processed',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        data: null,
      });
    }
  }
}

export default new PubSubController();
