import { Router } from 'express';
import { datasetController } from '../controllers/datasetController';

const router = Router();

router.get('/', datasetController.getAll);
router.get('/:id', datasetController.getById);
router.post('/', datasetController.create);
router.put('/:id', datasetController.update);
router.delete('/:id', datasetController.delete);

export default router;