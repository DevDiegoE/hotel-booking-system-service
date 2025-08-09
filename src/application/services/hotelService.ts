import { inject, injectable } from 'tsyringe';

import { IHotelRepository } from '../../domain/repositories/IHotelRepository.ts';
import { Hotel } from '../../domain/entities/hotel.ts';
import { CreateHotelUseCase } from '../../domain/use-cases/CreateHotelUseCase.ts';
import { HotelValidator } from '../../domain/validators/HotelValidator.ts';
import { NotFoundException, ValidationException } from '../../domain/exceptions/DomainException.ts';

@injectable()
export class HotelService {
    constructor(
        @inject('HotelRepository') private readonly hotelRepository: IHotelRepository,
        @inject(CreateHotelUseCase) private readonly createHotelUseCase: CreateHotelUseCase
    ) {}

    async create(hotelData: {
        name: string;
        location: string;
        description?: string;
    }): Promise<Hotel> {
        try {
            const result = await this.createHotelUseCase.execute(hotelData);
            return {
                name: result.name,
                location: result.location,
                description: result.description,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt,
            };
        } catch (error) {
            if (error instanceof ValidationException) {
                throw error;
            }
            throw new Error(`Failed to create hotel: ${(error as Error).message}`);
        }
    }

    async findAll(): Promise<Hotel[]> {
        try {
            return this.hotelRepository.findAll();
        } catch (error) {
            throw new Error(`Failed to fetch hotels: ${(error as Error).message}`);
        }
    }

    async findById(id: string): Promise<Hotel | null> {
        try {
            if (!id || id.trim().length === 0) {
                throw new ValidationException('Hotel ID is required');
            }

            return this.hotelRepository.findById(id);
        } catch (error) {
            if (error instanceof ValidationException) {
                throw error;
            }
            throw new Error(`Failed to fetch hotel: ${(error as Error).message}`);
        }
    }

    async updateById(id: string, hotelData: Partial<Hotel>): Promise<Hotel | null> {
        try {
            if (!id || id.trim().length === 0) {
                throw new ValidationException('Hotel ID is required');
            }
            HotelValidator.validateUpdate(hotelData);

            const existingHotel = await this.hotelRepository.findById(id);
            if (!existingHotel) {
                throw new NotFoundException('Hotel', id);
            }

            if (hotelData.name && hotelData.name !== existingHotel.name) {
                const hotelWithSameName = await this.hotelRepository.findByName(hotelData.name);
                if (hotelWithSameName) {
                    throw new ValidationException(
                        `Hotel with name '${hotelData.name}' already exists`
                    );
                }
            }

            return this.hotelRepository.update(id, hotelData);
        } catch (error) {
            if (error instanceof ValidationException || error instanceof NotFoundException) {
                throw error;
            }
            throw new Error(`Failed to update hotel: ${(error as Error).message}`);
        }
    }

    async deleteById(id: string): Promise<void> {
        try {
            if (!id || id.trim().length === 0) {
                throw new ValidationException('Hotel ID is required');
            }

            const existingHotel = await this.hotelRepository.findById(id);
            if (!existingHotel) {
                throw new NotFoundException('Hotel', id);
            }

            await this.hotelRepository.delete(id);
        } catch (error) {
            if (error instanceof ValidationException || error instanceof NotFoundException) {
                throw error;
            }
            throw new Error(`Failed to delete hotel: ${(error as Error).message}`);
        }
    }

    async findByName(name: string): Promise<Hotel | null> {
        try {
            if (!name || name.trim().length === 0) {
                throw new ValidationException('Hotel name is required');
            }

            return this.hotelRepository.findByName(name);
        } catch (error) {
            if (error instanceof ValidationException) {
                throw error;
            }
            throw new Error(`Failed to fetch hotel by name: ${(error as Error).message}`);
        }
    }

    async findByLocation(location: string): Promise<Hotel[]> {
        try {
            if (!location || location.trim().length === 0) {
                throw new ValidationException('Hotel location is required');
            }

            return this.hotelRepository.findByLocation(location);
        } catch (error) {
            if (error instanceof ValidationException) {
                throw error;
            }
            throw new Error(`Failed to fetch hotels by location: ${(error as Error).message}`);
        }
    }

    async findAvailableHotels(checkInDate: Date, checkOutDate: Date): Promise<Hotel[]> {
        try {
            if (!checkInDate || !checkOutDate) {
                throw new ValidationException('Check-in and check-out dates are required');
            }

            if (checkInDate >= checkOutDate) {
                throw new ValidationException('Check-out date must be after check-in date');
            }

            return this.hotelRepository.findAvailableHotels(checkInDate, checkOutDate);
        } catch (error) {
            if (error instanceof ValidationException) {
                throw error;
            }
            throw new Error(`Failed to fetch available hotels: ${(error as Error).message}`);
        }
    }
}
