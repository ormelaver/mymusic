import { Router } from 'express';
import UserTasteController from '../controllers/userTasteController';

const router = Router();

router.post('pubsub/create-taste', (req, res) =>
  UserTasteController.createTaste(req, res)
);
router.patch('/update', (req, res) =>
  UserTasteController.updateTaste(req, res)
);
router.post('/rank', (req, res) => UserTasteController.rank(req, res));

export default router;
