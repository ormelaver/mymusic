import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

import { body } from 'express-validator';

declare global {
  namespace Express {
    export interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

export const userDataValidations = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .isLength({ max: 128 })
    .withMessage('Password cannot exceed 128 characters')
    .not()
    .matches(/\s/)
    .withMessage('Password must not contain spaces'),
];

// Middleware to verify the token
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    console.log('DECODED TOKEN', decodedToken);
    next();
  } catch (error) {
    return res.status(401).send('Unauthorized');
  }
};
