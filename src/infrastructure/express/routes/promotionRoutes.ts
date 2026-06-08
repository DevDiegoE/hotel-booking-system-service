import { Router } from 'express';
import { container } from 'tsyringe';

import { validateRequest } from '../middlewares/validateRequest.ts';
import { promotionsSchema } from '../validators/promotionValidator.ts';
import { PromotionController }from '../controllers/promotionController.ts';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware.ts';

export const promotionRoutes = Router();
const promotionController = container.resolve(PromotionController);

promotionRoutes.post(
    '/',
    authMiddleware,
    requireRole('admin'),
    validateRequest(promotionsSchema),
    promotionController.create
);
promotionRoutes.get('/', promotionController.getAll);
promotionRoutes.get('/name/:name', promotionController.getByName);
promotionRoutes.get('/type/:type', promotionController.getByType);
promotionRoutes.get('/:id', promotionController.getById);
promotionRoutes.put(
    '/:id',
    authMiddleware,
    requireRole('admin'),
    validateRequest(promotionsSchema.partial()),
    promotionController.update
);
promotionRoutes.delete('/:id', authMiddleware, requireRole('admin'), promotionController.deleteById);
