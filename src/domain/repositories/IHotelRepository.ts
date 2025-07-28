import { ICrudRepository } from './ICrudRepository.ts';
import { Hotel } from '../entities/hotel.ts';

export interface IHotelRepository extends ICrudRepository<Hotel> {
    findByName(name: string): Promise<Hotel | null>;
    findByLocation(location: string): Promise<Hotel[]>;
    findAvailableHotels(checkInDate: Date, checkOutDate: Date): Promise<Hotel[]>;
}
