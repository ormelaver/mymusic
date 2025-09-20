import { Router } from 'express';
import PubSubController from '../controllers/pubSubController';

const router = Router();

// Route for Google Pub/Sub to publish messages to core-service
router.post('/pubsub/ranked-results', PubSubController.handlePubSubMessage);

export default router;
