import { ICrudRepository } from './ICrudRepository.ts';
import { Room } from '../entities/room.ts';

export interface IRoomRepository extends ICrudRepository<Room> {
    findByHotelId(hotelId: string): Promise<Room[]>;
    findAvailableRooms(hotelId: string, checkInDate: Date, checkOutDate: Date): Promise<Room[]>;
    findByTypeAndHotelId(type: string, hotelId: string): Promise<Room[]>;
}
