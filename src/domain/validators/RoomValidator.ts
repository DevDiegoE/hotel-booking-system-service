import { Room } from '../entities/room.ts';
import { ValidationException, BusinessRuleException } from '../exceptions/DomainException.ts';

export class RoomValidator {
    static validateCreate(room: Room): void {
        if (!room.hotelId || room.hotelId.trim().length === 0) {
            throw new ValidationException('Hotel ID is required');
        }

        if (
            !room.type ||
            !['single-1', 'single-2', 'single-3', 'suite-2', 'suite-family'].includes(room.type)
        ) {
            throw new ValidationException('Invalid room type');
        }

        if (room.basePrice <= 0) {
            throw new ValidationException('Base price must be greater than zero');
        }

        if (room.basePrice > 5000) {
            throw new BusinessRuleException('Base price cannot exceed $5,000 per night');
        }

        if (!room.amenities || room.amenities.length === 0) {
            throw new ValidationException('At least one amenity is required');
        }

        if (room.amenities.length > 20) {
            throw new BusinessRuleException('Maximum 20 amenities allowed per room');
        }

        // Validate amenity names
        const validAmenities = [
            'wifi',
            'tv',
            'ac',
            'heating',
            'kitchen',
            'bathroom',
            'balcony',
            'parking',
            'gym',
            'pool',
            'spa',
            'restaurant',
            'bar',
            'room-service',
            'laundry',
            'concierge',
            'security',
            'elevator',
            'accessible',
            'pet-friendly',
        ];

        for (const amenity of room.amenities) {
            if (!validAmenities.includes(amenity.toLowerCase())) {
                throw new ValidationException(`Invalid amenity: ${amenity}`);
            }
        }
    }

    static validateUpdate(room: Partial<Room>): void {
        if (
            room.type !== undefined &&
            !['single-1', 'single-2', 'single-3', 'suite-2', 'suite-family'].includes(room.type)
        ) {
            throw new ValidationException('Invalid room type');
        }

        if (room.basePrice !== undefined && room.basePrice <= 0) {
            throw new ValidationException('Base price must be greater than zero');
        }

        if (room.basePrice !== undefined && room.basePrice > 5000) {
            throw new BusinessRuleException('Base price cannot exceed $5,000 per night');
        }

        if (room.amenities !== undefined) {
            if (room.amenities.length === 0) {
                throw new ValidationException('At least one amenity is required');
            }

            if (room.amenities.length > 20) {
                throw new BusinessRuleException('Maximum 20 amenities allowed per room');
            }

            const validAmenities = [
                'wifi',
                'tv',
                'ac',
                'heating',
                'kitchen',
                'bathroom',
                'balcony',
                'parking',
                'gym',
                'pool',
                'spa',
                'restaurant',
                'bar',
                'room-service',
                'laundry',
                'concierge',
                'security',
                'elevator',
                'accessible',
                'pet-friendly',
            ];

            for (const amenity of room.amenities) {
                if (!validAmenities.includes(amenity.toLowerCase())) {
                    throw new ValidationException(`Invalid amenity: ${amenity}`);
                }
            }
        }
    }
}
