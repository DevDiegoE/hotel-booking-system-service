import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import mongoose from 'mongoose';

import { PromotionService } from '../../../application/services/promotionService.ts';

@injectable()
export class PromotionController {
    constructor(@inject(PromotionService) private readonly promotionService: PromotionService) {}

    create = async (req: Request, res: Response): Promise<Response> => {
        try {
            const promotion = await this.promotionService.create(req.body);
            return res.status(201).json(promotion);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getAll = async (_req: Request, res: Response): Promise<Response> => {
        try {
            const promotions = await this.promotionService.findAll();
            return res.status(200).json(promotions);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getById = async (req: Request, res: Response): Promise<Response> => {
        try {
            const id = req.params.id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid promotion ID format' });
            }

            const promotion = await this.promotionService.findById(id);
            if (!promotion) {
                return res.status(404).json({ message: 'Promotion not found' });
            }
            return res.status(200).json(promotion);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    update = async (req: Request, res: Response): Promise<Response> => {
        try {
            const updatedPromotion = await this.promotionService.updateById(
                req.params.id,
                req.body
            );
            if (!updatedPromotion) {
                return res.status(404).json({ message: 'Promotion not found' });
            }
            return res.status(200).json(updatedPromotion);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    deleteById = async (req: Request, res: Response): Promise<Response> => {
        try {
            await this.promotionService.deleteById(req.params.id);
            return res.status(204).send();
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getByName = async (req: Request, res: Response): Promise<Response> => {
        try {
            const name = req.params.name;
            const promotion = await this.promotionService.findByName(name);
            if (!promotion) {
                return res.status(404).json({ message: 'Promotion not found' });
            }
            return res.status(200).json(promotion);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };

    getByType = async (req: Request, res: Response): Promise<Response> => {
        try {
            const type = req.params.type as 'age-discount' | 'family-discount';
            const promotions = await this.promotionService.findByType(type);
            return res.status(200).json(promotions);
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Internal Server Error', error: (error as Error).message });
        }
    };
}
