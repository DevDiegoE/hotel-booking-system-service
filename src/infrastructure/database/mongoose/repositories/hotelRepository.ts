import { injectable } from 'tsyringe';

import { IHotelRepository } from '../../../../domain/repositories/IHotelRepository.ts';
import { Hotel } from '../../../../domain/entities/hotel.ts';
import { HotelModel } from '../hotelModel.ts';

@injectable()
export class HotelRepository implements IHotelRepository {
    async create(hotel: Hotel): Promise<Hotel> {
        const created = await HotelModel.create(hotel);
        return created.toObject() as Hotel;
    }

    async findAll(): Promise<Hotel[]> {
        const hotels = await HotelModel.find();
        return hotels.map((h) => h.toObject() as Hotel);
    }

    async findById(id: string): Promise<Hotel | null> {
        const hotel = await HotelModel.findById(id);
        return hotel ? (hotel.toObject() as Hotel) : null;
    }

    async update(id: string, hotel: Partial<Hotel>): Promise<Hotel | null> {
        const updated = await HotelModel.findByIdAndUpdate(id, hotel, { new: true });
        return updated ? (updated.toObject() as Hotel) : null;
    }

    async delete(id: string): Promise<void> {
        await HotelModel.findByIdAndDelete(id);
    }

    async findByName(name: string): Promise<Hotel | null> {
        const hotel = await HotelModel.findOne({ name });
        return hotel ? (hotel.toObject() as Hotel) : null;
    }

    async findByLocation(location: string): Promise<Hotel[]> {
        const hotels = await HotelModel.find({ location });
        return hotels.map((h) => h.toObject() as Hotel);
    }

    async findAvailableHotels(_startDate: Date, _endDate: Date): Promise<Hotel[]> {
        const hotels = await HotelModel.find({});
        return hotels.map((h) => h.toObject() as Hotel);
    }

    async distinctLocations(): Promise<string[]> {
        return HotelModel.distinct('location');
    }
}
