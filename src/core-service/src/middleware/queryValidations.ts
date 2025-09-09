import { body } from 'express-validator';
import { QueryInterval, Platform, Notifictions } from '../types/query';

export const queryValidations = [
  body('queries')
    .exists()
    .withMessage('queries is required')
    .isArray()
    .withMessage('queries must be an array')
    .isLength({ min: 1 })
    .withMessage('queries must be an array with at least one element'),
  body('queries.*.name')
    .exists()
    .withMessage('name is required')
    .isString()
    .withMessage('name must be a string')
    .isLength({ min: 3 })
    .withMessage('name must be minimum 3 characters long'),
  body('queries.*.term')
    .exists()
    .withMessage('search term is required')
    .isString()
    .withMessage('search term must be a string')
    .isLength({ min: 3 })
    .withMessage('search term must be minimum 3 characters long'),
  body('queries.*.interval')
    .exists()
    .withMessage('interval is required')
    .isIn([QueryInterval.DAY, QueryInterval.WEEK, QueryInterval.MONTH])
    .withMessage('interval must be one of 1, 7, 30'),
  body('queries.*.platform')
    .exists()
    .withMessage('platform is required')
    .isIn([Platform.SOUNDCLOUD, Platform.YOUTUBE])
    .withMessage('platform must be one of SOUNDCLOUD, YOUTUBE'),
  body('queries.*.lastResult').exists().withMessage('lastResult is required'),
  body('queries.*.notifyBy')
    .exists()
    .withMessage('notifyBy is required')
    .isArray()
    .withMessage('notifyBy must be an array')
    .isIn([Notifictions.EMAIL, Notifictions.SMS])
    .withMessage('notifyBy must be one of EMAIL, SMS'),
];
