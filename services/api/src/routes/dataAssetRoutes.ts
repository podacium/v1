import { Router } from 'express';
import { dataAssetController } from '../controllers/dataAssetController';

const router = Router();

router.get('/', dataAssetController.getAll);
router.get('/:id', dataAssetController.getById);
router.post('/', dataAssetController.create);
router.put('/:id', dataAssetController.update);
router.delete('/:id', dataAssetController.delete);

export default router;