import { Router } from 'express';
import { demoController } from '../controllers/demoController';

const router = Router();

router.get('/', demoController.getAll);
router.get('/:id', demoController.getById);
router.post('/', demoController.create);
router.put('/:id', demoController.update);
router.delete('/:id', demoController.delete);

export default router;