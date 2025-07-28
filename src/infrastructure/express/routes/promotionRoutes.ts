import { Router } from 'express';
import { container } from 'tsyringe';

import { validateRequest } from '../middlewares/validateRequest.ts';
import { promotionsSchema } from '../validators/promotionValidator.ts';
import { PromotionController }from '../controllers/promotionController.ts';

export const promotionRoutes = Router();
const promotionController = container.resolve(PromotionController);

promotionRoutes.post('/', validateRequest(promotionsSchema), promotionController.create);
promotionRoutes.get('/', promotionController.getAll);
promotionRoutes.get('/:id', promotionController.getById);
promotionRoutes.put('/:id', validateRequest(promotionsSchema.optional()), promotionController.update);
promotionRoutes.delete('/:id', promotionController.deleteById);

promotionRoutes.get('/name/:name', promotionController.getByName);
promotionRoutes.get('/type/:type', promotionController.getByType);
