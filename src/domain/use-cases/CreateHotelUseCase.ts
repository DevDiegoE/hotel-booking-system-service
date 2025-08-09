import { inject, injectable } from 'tsyringe';
import { IHotelRepository } from '../repositories/IHotelRepository.ts';
import { Hotel } from '../entities/hotel.ts';
import { HotelValidator } from '../validators/HotelValidator.ts';
import { ValidationException } from '../exceptions/DomainException.ts';

export interface CreateHotelRequest {
    name: string;
    location: string;
    description?: string;
}

@injectable()
export class CreateHotelUseCase {
    constructor(@inject('HotelRepository') private readonly hotelRepository: IHotelRepository) {}

    async execute(request: CreateHotelRequest): Promise<Hotel> {
        const hotel: Hotel = {
            name: request.name,
            location: request.location,
            description: request.description,
        };

        HotelValidator.validateCreate(hotel);
        const existingHotel = await this.hotelRepository.findByName(hotel.name);
        if (existingHotel) {
            throw new ValidationException(`Hotel with name '${hotel.name}' already exists`);
        }
        const createdHotel = await this.hotelRepository.create(hotel);
        return createdHotel;
    }
}
