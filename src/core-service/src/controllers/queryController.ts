import { Request, Response } from 'express';
import QueryService from '../service/queryService';

class QueryController {
  async addQueries(req: Request, res: Response): Promise<void> {
    try {
      const uid = req.user!.uid;
      const queries = req.body.queries;
      const response = await QueryService.addQueries(uid, queries);
      res.status(201).json(response);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new QueryController();
