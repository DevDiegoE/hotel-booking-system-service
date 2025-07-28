import { inject, injectable } from 'tsyringe';

import { IPromotionRepository } from '../../domain/repositories/IPromotionRepository.ts';
import { Promotion } from '../../domain/entities/promotion.ts';

@injectable()
export class PromotionService {
    constructor(
        @inject('PromotionRepository') private readonly promotionRepository: IPromotionRepository
    ) {}

    async create(promotion: Promotion): Promise<Promotion> {
        return this.promotionRepository.create(promotion);
    }

    async findAll(): Promise<Promotion[]> {
        return this.promotionRepository.findAll();
    }

    async findById(id: string): Promise<Promotion | null> {
        return this.promotionRepository.findById(id);
    }

    async updateById(id: string, promotion: Partial<Promotion>): Promise<Promotion | null> {
        return this.promotionRepository.update(id, promotion);
    }

    async deleteById(id: string): Promise<void> {
        return this.promotionRepository.delete(id);
    }

    async findByName(name: string): Promise<Promotion | null> {
        return this.promotionRepository.findByName(name);
    }

    async findByType(type: 'age-discount' | 'family-discount'): Promise<Promotion[]> {
        return this.promotionRepository.findByType(type);
    }
}
