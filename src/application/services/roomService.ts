import { inject, injectable } from 'tsyringe';

import { IRoomRepository } from '../../domain/repositories/IRoomRepository.ts';
import { Room } from '../../domain/entities/room.ts';

@injectable()
export class RoomService {
    constructor(@inject('RoomRepository') private readonly roomRepository: IRoomRepository) {}

    async create(room: Room): Promise<Room> {
        return this.roomRepository.create(room);
    }

    async findAll(): Promise<Room[]> {
        return this.roomRepository.findAll();
    }

    async findById(id: string): Promise<Room | null> {
        return this.roomRepository.findById(id);
    }

    async updateById(id: string, room: Partial<Room>): Promise<Room | null> {
        return this.roomRepository.update(id, room);
    }

    async deleteById(id: string): Promise<void> {
        return this.roomRepository.delete(id);
    }

    async findByHotelId(hotelId: string): Promise<Room[]> {
        return this.roomRepository.findByHotelId(hotelId);
    }

    async findAvailableRooms(
        hotelId: string,
        checkInDate: Date,
        checkOutDate: Date
    ): Promise<Room[]> {
        return this.roomRepository.findAvailableRooms(hotelId, checkInDate, checkOutDate);
    }

    async findByTypeAndHotelId(type: string, hotelId: string): Promise<Room[]> {
        return this.roomRepository.findByTypeAndHotelId(type, hotelId);
    }
}
