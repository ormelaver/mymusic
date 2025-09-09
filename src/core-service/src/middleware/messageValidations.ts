import { body } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateMessageRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const messageValidations = [
  body('message').exists().withMessage('message is required'),
  body('message.data')
    .exists()
    .withMessage('message.data is required')
    .isString()
    .withMessage('message.data must be a base64 string'),
  // You can't validate decoded data here, but you can do it in the service after decoding
];
