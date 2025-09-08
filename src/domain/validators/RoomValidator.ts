import { Room } from '../entities/room.ts';
import { ValidationException, BusinessRuleException } from '../exceptions/DomainException.ts';
import {
    VALID_AMENITIES,
    ROOM_TYPES,
    MAX_AMENITIES_PER_ROOM,
    MAX_ROOM_PRICE,
} from '../../shared/constants/room-constants.ts';

export class RoomValidator {
    static validateCreate(room: Room): void {
        if (!room.hotelId || room.hotelId.trim().length === 0) {
            throw new ValidationException('Hotel ID is required');
        }

        if (!room.type || !ROOM_TYPES.includes(room.type as any)) {
            throw new ValidationException('Invalid room type');
        }

        if (room.basePrice <= 0) {
            throw new ValidationException('Base price must be greater than zero');
        }

        if (room.basePrice > MAX_ROOM_PRICE) {
            throw new BusinessRuleException(
                `Base price cannot exceed $${MAX_ROOM_PRICE} per night`
            );
        }

        if (!room.amenities || room.amenities.length === 0) {
            throw new ValidationException('At least one amenity is required');
        }

        if (room.amenities.length > MAX_AMENITIES_PER_ROOM) {
            throw new BusinessRuleException(
                `Maximum ${MAX_AMENITIES_PER_ROOM} amenities allowed per room`
            );
        }

        for (const amenity of room.amenities) {
            if (!VALID_AMENITIES.includes(amenity.toLowerCase() as any)) {
                throw new ValidationException(`Invalid amenity: ${amenity}`);
            }
        }
    }

    static validateUpdate(room: Partial<Room>): void {
        if (room.type !== undefined && !ROOM_TYPES.includes(room.type as any)) {
            throw new ValidationException('Invalid room type');
        }

        if (room.basePrice !== undefined && room.basePrice <= 0) {
            throw new ValidationException('Base price must be greater than zero');
        }

        if (room.basePrice !== undefined && room.basePrice > MAX_ROOM_PRICE) {
            throw new BusinessRuleException(
                `Base price cannot exceed $${MAX_ROOM_PRICE} per night`
            );
        }

        if (room.amenities !== undefined) {
            if (room.amenities.length === 0) {
                throw new ValidationException('At least one amenity is required');
            }

            if (room.amenities.length > MAX_AMENITIES_PER_ROOM) {
                throw new BusinessRuleException(
                    `Maximum ${MAX_AMENITIES_PER_ROOM} amenities allowed per room`
                );
            }

            for (const amenity of room.amenities) {
                if (!VALID_AMENITIES.includes(amenity.toLowerCase() as any)) {
                    throw new ValidationException(`Invalid amenity: ${amenity}`);
                }
            }
        }
    }
}
