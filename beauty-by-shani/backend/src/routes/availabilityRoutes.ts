import { Router } from 'express';
import { getAvailability, setAvailability, blockTime, syncGoogleCalendar, getAvailableDates, getAdminAvailability, unblockTime } from '../controllers/availabilityController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getAvailability);
router.get('/admin', authMiddleware, getAdminAvailability);
router.post('/', authMiddleware, setAvailability);
router.post('/block', authMiddleware, blockTime);
router.delete('/unblock/:id', authMiddleware, unblockTime);
router.post('/sync', authMiddleware, syncGoogleCalendar);
router.get('/dates', getAvailableDates);

export default router;