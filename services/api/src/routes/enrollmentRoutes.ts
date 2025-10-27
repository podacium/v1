import { Router } from 'express';
import { enrollmentController } from '../controllers/enrollmentController';

const router = Router();

router.get('/', enrollmentController.getAll);
router.get('/:id', enrollmentController.getById);
router.post('/', enrollmentController.create);
router.put('/:id', enrollmentController.update);
router.delete('/:id', enrollmentController.delete);

export default router;