import { inject, injectable } from 'tsyringe';

import { IHotelRepository } from '../../domain/repositories/IHotelRepository.ts';
import { Hotel } from '../../domain/entities/hotel.ts';

@injectable()
export class HotelService {
    constructor(@inject('HotelRepository') private readonly hotelRepository: IHotelRepository) {}

    async create(hotel: Hotel): Promise<Hotel> {
        return this.hotelRepository.create(hotel);
    }

    async findAll(): Promise<Hotel[]> {
        return this.hotelRepository.findAll();
    }

    async findById(id: string): Promise<Hotel | null> {
        return this.hotelRepository.findById(id);
    }

    async updateById(id: string, hotel: Partial<Hotel>): Promise<Hotel | null> {
        return this.hotelRepository.update(id, hotel);
    }

    async deleteById(id: string): Promise<void> {
        return this.hotelRepository.delete(id);
    }

    async findByName(name: string): Promise<Hotel | null> {
        return this.hotelRepository.findByName(name);
    }

    async findByLocation(location: string): Promise<Hotel[]> {
        return this.hotelRepository.findByLocation(location);
    }

    async findAvailableHotels(checkInDate: Date, checkOutDate: Date): Promise<Hotel[]> {
        return this.hotelRepository.findAvailableHotels(checkInDate, checkOutDate);
    }
}
