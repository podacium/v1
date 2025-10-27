import { Router } from 'express';
import { scheduleController } from '../controllers/scheduleController';

const router = Router();

router.get('/', scheduleController.getAll);
router.get('/:id', scheduleController.getById);
router.post('/', scheduleController.create);
router.put('/:id', scheduleController.update);
router.delete('/:id', scheduleController.delete);

export default router;