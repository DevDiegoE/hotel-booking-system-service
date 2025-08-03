import { Router } from 'express';
import { container } from 'tsyringe';
import { AuthController } from '../controllers/authController.ts';
import { validateRequest } from '../middlewares/validateRequest.ts';
import { authSchema } from '../validators/authValidator.ts';

export const authRoutes = Router();
const authController = container.resolve(AuthController);

authRoutes.post('/register', validateRequest(authSchema), authController.register);
authRoutes.post('/login', validateRequest(authSchema), authController.login);
