import { Router } from 'express';
import { list, create, update, remove, getMainServices, getAddOns } from '../controllers/servicesController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate, serviceSchema } from '../middlewares/validateInput';

const router = Router();

router.get('/', list);
router.get('/main', getMainServices);
router.get('/addons', getAddOns);
router.post('/', authMiddleware, validate(serviceSchema), create);
router.put('/:id', authMiddleware, validate(serviceSchema), update);
router.delete('/:id', authMiddleware, remove);

export default router;