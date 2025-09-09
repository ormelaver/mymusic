import { Router } from 'express';
import QueryController from '../controllers/queryController';
import { validateRequest } from '../middleware/requestValidations';
import { queryValidations } from '../middleware/queryValidations';
import { verifyToken } from '../middleware/userValidations';

const router = Router();

router.post(
  '/queries/add',
  queryValidations,
  validateRequest,
  verifyToken,
  QueryController.addQueries
);

export default router;
