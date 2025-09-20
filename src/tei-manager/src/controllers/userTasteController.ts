import { Request, Response } from 'express';
import UserTasteService from '../services/userTasteService';
import { SingleQuery, YoutubeSearchResult } from '../types/taste';

class UserTasteController {
  async createTaste(req: Request, res: Response) {
    try {
      // Only handle PubSub push: body must have a 'message' property with base64 data
      if (!(req.body && req.body.message && req.body.message.data)) {
        return res.status(400).json({
          status: 'error',
          message: 'Expected PubSub push format',
          data: null,
        });
      }
      const result = await UserTasteService.createTaste(req.body.message);
      res.status(201).json({
        status: 'success',
        message: 'Taste created from event',
        data: result,
      });
    } catch (err: any) {
      res
        .status(500)
        .json({ status: 'error', message: err.message, data: null });
    }
  }

  async updateTaste(req: Request, res: Response) {
    try {
      const result = await UserTasteService.updateTaste(req.body);
      res
        .status(200)
        .json({ status: 'success', message: 'Taste updated', data: result });
    } catch (err: any) {
      res
        .status(500)
        .json({ status: 'error', message: err.message, data: null });
    }
  }

  async rank(req: Request, res: Response) {
    try {
      const pubsubMessage = req.body.message;
      console.log('****RANK REQ BODY (controller):', req.body.message);
      if (!pubsubMessage || !pubsubMessage.data) {
        throw new Error('Missing Pub/Sub message data');
      }
      const result = await UserTasteService.rank(pubsubMessage);
      res
        .status(200)
        .json({ status: 'success', message: 'Ranking complete', data: result });
    } catch (err: any) {
      res
        .status(500)
        .json({ status: 'error', message: err.message, data: null });
    }
  }
}

export default new UserTasteController();
