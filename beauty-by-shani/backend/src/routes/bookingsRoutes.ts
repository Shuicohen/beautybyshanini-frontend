import { Router } from 'express';
import { create, getAll, manage, update, getCalendarFile, getBookingDetails } from '../controllers/bookingsController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate, bookingSchema } from '../middlewares/validateInput';

const router = Router();

router.post('/', validate(bookingSchema), create);
router.get('/', authMiddleware, getAll);
router.put('/:id', authMiddleware, update);
router.get('/manage', manage);
router.get('/calendar/:token', getCalendarFile);
router.get('/details/:token', getBookingDetails);

export default router;