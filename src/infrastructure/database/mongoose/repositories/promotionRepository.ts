import { injectable } from 'tsyringe';

import { IPromotionRepository } from '../../../../domain/repositories/IPromotionRepository.ts';
import { Promotion } from '../../../../domain/entities/promotion.ts';
import { PromotionModel } from '../promotionModel.ts';

@injectable()
export class PromotionRepository implements IPromotionRepository {
    async create(promotion: Promotion): Promise<Promotion> {
        const created = await PromotionModel.create(promotion);
        return created.toObject() as Promotion;
    }

    async findAll(): Promise<Promotion[]> {
        const promotions = await PromotionModel.find();
        return promotions.map((p) => p.toObject() as Promotion);
    }

    async findById(id: string): Promise<Promotion | null> {
        const promotion = await PromotionModel.findById(id);
        return promotion ? (promotion.toObject() as Promotion) : null;
    }

    async update(id: string, promotion: Partial<Promotion>): Promise<Promotion | null> {
        const updated = await PromotionModel.findByIdAndUpdate(id, promotion, { new: true });
        return updated ? (updated.toObject() as Promotion) : null;
    }

    async delete(id: string): Promise<void> {
        await PromotionModel.findByIdAndDelete(id);
    }

    async findByName(name: string): Promise<Promotion | null> {
        const promotion = await PromotionModel.findOne({ name });

        return promotion ? (promotion.toObject() as Promotion) : null;
    }

    async findByType(type: 'age-discount' | 'family-discount'): Promise<Promotion[]> {
        const promotions = await PromotionModel.find({ type });
        return promotions.map((p) => p.toObject() as Promotion);
    }
}
