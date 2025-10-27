import { Router } from 'express';
import { aiChatController } from '../controllers/aiChatController';

const router = Router();

router.get('/', aiChatController.getAll);
router.get('/:id', aiChatController.getById);
router.post('/', aiChatController.create);
router.put('/:id', aiChatController.update);
router.delete('/:id', aiChatController.delete);

export default router;