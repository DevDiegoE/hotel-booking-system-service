import { ICrudRepository } from './ICrudRepository.ts';
import { Room } from '../entities/room.ts';

export interface RoomSearchFilters {
    hotelId?: string;
    location?: string;
    minCapacity?: number;
    minPrice?: number;
    maxPrice?: number;
    type?: Room['type'];
}

export interface IRoomRepository extends ICrudRepository<Room> {
    findByHotelId(hotelId: string): Promise<Room[]>;
    findAvailableRooms(hotelId: string, checkInDate: Date, checkOutDate: Date): Promise<Room[]>;
    findByTypeAndHotelId(type: string, hotelId: string): Promise<Room[]>;
    findByCapacity(minCapacity: number): Promise<Room[]>;
    findByPriceRange(minPrice?: number, maxPrice?: number): Promise<Room[]>;
    findByHotelLocation(location: string): Promise<Room[]>;
    search(filters: RoomSearchFilters): Promise<Room[]>;
}
