import { Router } from 'express';
import UserController from '../controllers/userController';
import { userDataValidations } from '../middleware/userValidations';
import { validateRequest } from '../middleware/requestValidations';

const router = Router();

router.post(
  '/users/add',
  userDataValidations,
  validateRequest,
  UserController.addUser
);

router.post(
  '/users/login',
  userDataValidations,
  validateRequest,
  UserController.login
);

export default router;
