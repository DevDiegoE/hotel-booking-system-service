import { inject, injectable } from 'tsyringe';
import { IRoomRepository } from '../repositories/IRoomRepository.ts';
import { IHotelRepository } from '../repositories/IHotelRepository.ts';
import { Room } from '../entities/room.ts';
import { RoomValidator } from '../validators/RoomValidator.ts';
import { NotFoundException, ValidationException } from '../exceptions/DomainException.ts';

export interface UpdateRoomRequest {
    id: string;
    data: Partial<Room>;
}

@injectable()
export class UpdateRoomUseCase {
    constructor(
        @inject('RoomRepository') private readonly roomRepository: IRoomRepository,
        @inject('HotelRepository') private readonly hotelRepository: IHotelRepository
    ) {}

    async execute(request: UpdateRoomRequest): Promise<Room | null> {
        const { id, data } = request;
        if (!id || id.trim().length === 0) {
            throw new ValidationException('Room ID is required');
        }

        const existing = await this.roomRepository.findById(id);
        if (!existing) {
            throw new NotFoundException('Room', id);
        }

        if (data.hotelId) {
            const hotel = await this.hotelRepository.findById(data.hotelId);
            if (!hotel) {
                throw new NotFoundException('Hotel', data.hotelId);
            }
        }

        RoomValidator.validateUpdate(data);
        return this.roomRepository.update(id, data);
    }
}
