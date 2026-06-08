import { inject, injectable } from 'tsyringe';
import { IRoomRepository } from '../repositories/IRoomRepository.ts';
import { IHotelRepository } from '../repositories/IHotelRepository.ts';
import { Room } from '../entities/room.ts';
import { RoomValidator } from '../validators/RoomValidator.ts';
import { NotFoundException } from '../exceptions/DomainException.ts';

export interface CreateRoomRequest {
    hotelId: string;
    type: Room['type'];
    basePrice: number;
    amenities: string[];
    capacity: number;
    totalRooms: number;
}

@injectable()
export class CreateRoomUseCase {
    constructor(
        @inject('RoomRepository') private readonly roomRepository: IRoomRepository,
        @inject('HotelRepository') private readonly hotelRepository: IHotelRepository
    ) {}

    async execute(request: CreateRoomRequest): Promise<Room> {
        const room: Room = {
            hotelId: request.hotelId,
            type: request.type,
            basePrice: request.basePrice,
            amenities: request.amenities,
            capacity: request.capacity,
            totalRooms: request.totalRooms,
        };

        RoomValidator.validateCreate(room);

        const hotel = await this.hotelRepository.findById(room.hotelId);
        if (!hotel) {
            throw new NotFoundException('Hotel', room.hotelId);
        }

        const created = await this.roomRepository.create(room);
        return created;
    }
}
