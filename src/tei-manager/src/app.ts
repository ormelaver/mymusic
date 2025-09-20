import express, { Request, Response, NextFunction } from 'express';
import { json } from 'body-parser';
import userTasteRoute from './routes/userTasteRoute';

const app = express();

app.use(json());

app.use('/user-taste', userTasteRoute);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ status: 'error', message: err.message, data: null });
});

export { app };
