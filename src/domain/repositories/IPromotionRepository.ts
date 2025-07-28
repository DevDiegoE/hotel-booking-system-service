import { ICrudRepository } from './ICrudRepository.ts';
import { Promotion } from '../entities/promotion.ts';

export interface IPromotionRepository extends ICrudRepository<Promotion> {
    findByName(name: string): Promise<Promotion | null>;
    findByType(type: 'age-discount' | 'family-discount'): Promise<Promotion[]>;
}
