import { Router } from 'express';
import { login } from '../controllers/authController';
import { validate, loginSchema } from '../middlewares/validateInput';

const router = Router();

router.post('/login', validate(loginSchema), login);

export default router;
