import { Hotel } from '../entities/hotel.ts';
import { ValidationException } from '../exceptions/DomainException.ts';

export class HotelValidator {
    static validateCreate(hotel: Hotel): void {
        if (!hotel.name || hotel.name.trim().length === 0) {
            throw new ValidationException('Hotel name is required');
        }

        if (!hotel.location || hotel.location.trim().length === 0) {
            throw new ValidationException('Hotel location is required');
        }

        if (hotel.name.length > 100) {
            throw new ValidationException('Hotel name cannot exceed 100 characters');
        }

        if (hotel.location.length > 200) {
            throw new ValidationException('Hotel location cannot exceed 200 characters');
        }

        if (hotel.description && hotel.description.length > 1000) {
            throw new ValidationException('Hotel description cannot exceed 1000 characters');
        }
    }

    static validateUpdate(hotel: Partial<Hotel>): void {
        if (hotel.name !== undefined) {
            if (hotel.name.trim().length === 0) {
                throw new ValidationException('Hotel name cannot be empty');
            }
            if (hotel.name.length > 100) {
                throw new ValidationException('Hotel name cannot exceed 100 characters');
            }
        }

        if (hotel.location !== undefined) {
            if (hotel.location.trim().length === 0) {
                throw new ValidationException('Hotel location cannot be empty');
            }
            if (hotel.location.length > 200) {
                throw new ValidationException('Hotel location cannot exceed 200 characters');
            }
        }

        if (hotel.description !== undefined && hotel.description.length > 1000) {
            throw new ValidationException('Hotel description cannot exceed 1000 characters');
        }
    }
}
