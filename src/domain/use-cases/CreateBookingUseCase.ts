import { inject, injectable } from 'tsyringe';
import { IBookingRepository } from '../repositories/IBookingRepository.ts';
import { IHotelRepository } from '../repositories/IHotelRepository.ts';
import { IRoomRepository } from '../repositories/IRoomRepository.ts';
import { IPromotionRepository } from '../repositories/IPromotionRepository.ts';
import { Booking } from '../entities/booking.ts';
import { BookingValidator } from '../validators/BookingValidator.ts';
import { NotFoundException, BusinessRuleException } from '../exceptions/DomainException.ts';

export interface CreateBookingRequest {
    userId: string;
    hotelId: string;
    roomSelections: {
        roomType: 'single-1' | 'single-2' | 'single-3' | 'suite-2' | 'suite-family';
        quantity: number;
    }[];
    checkInDate: Date;
    checkOutDate: Date;
    totalPrice: number;
    guests: {
        type: 'adult' | 'child';
        count: number;
    };
    appliedPromotions?: string[];
}

export interface CreateBookingResponse {
    bookings: {
        id: string;
        userId: string;
        hotelId: string;
        roomId: string;
        checkInDate: Date;
        checkOutDate: Date;
        totalPrice: number;
        guests: {
            type: 'adult' | 'child';
            count: number;
        };
        status: 'pending' | 'confirmed' | 'cancelled';
        createdAt: Date;
        updatedAt: Date;
    }[];
    totalRooms: number;
    totalPrice: number;
}

@injectable()
export class CreateBookingUseCase {
    constructor(
        @inject('BookingRepository') private readonly bookingRepository: IBookingRepository,
        @inject('HotelRepository') private readonly hotelRepository: IHotelRepository,
        @inject('RoomRepository') private readonly roomRepository: IRoomRepository,
        @inject('PromotionRepository') private readonly promotionRepository: IPromotionRepository
    ) {}

    async execute(request: CreateBookingRequest): Promise<CreateBookingResponse> {
        const hotel = await this.hotelRepository.findById(request.hotelId);
        if (!hotel) {
            throw new NotFoundException('Hotel', request.hotelId);
        }

        if (!request.roomSelections || request.roomSelections.length === 0) {
            throw new BusinessRuleException('At least one room selection is required');
        }

        for (const selection of request.roomSelections) {
            if (selection.quantity <= 0) {
                throw new BusinessRuleException(
                    `Room quantity must be at least 1 for type ${selection.roomType}`
                );
            }
        }

        const conflictingBookings = await this.bookingRepository.findByDateRange(
            request.checkInDate,
            request.checkOutDate
        );

        const allBookingsToCreate: Booking[] = [];
        let expectedTotalPrice = 0;

        for (const selection of request.roomSelections) {
            const roomTypes = await this.roomRepository.findByTypeAndHotelId(
                selection.roomType,
                request.hotelId
            );

            if (roomTypes.length === 0) {
                throw new BusinessRuleException(
                    `No rooms of type ${selection.roomType} available in this hotel`
                );
            }

            const roomType = roomTypes[0];
            const occupiedCount = conflictingBookings.filter(
                (b) =>
                    b.status !== 'cancelled' &&
                    b.roomType === selection.roomType &&
                    b.hotelId === request.hotelId
            ).length;

            const availableCount = roomType.totalRooms - occupiedCount;

            if (availableCount < selection.quantity) {
                throw new BusinessRuleException(
                    `Only ${availableCount} rooms of type ${selection.roomType} available for the selected dates. You requested ${selection.quantity}.`
                );
            }

            const stayDuration = request.checkOutDate.getTime() - request.checkInDate.getTime();
            const days = Math.ceil(stayDuration / (1000 * 60 * 60 * 24));
            const pricePerRoom = roomType.basePrice * days;
            expectedTotalPrice += pricePerRoom * selection.quantity;

            for (let i = 0; i < selection.quantity; i++) {
                allBookingsToCreate.push({
                    userId: request.userId,
                    hotelId: request.hotelId,
                    roomType: selection.roomType,
                    checkInDate: request.checkInDate,
                    checkOutDate: request.checkOutDate,
                    totalPrice: pricePerRoom,
                    guests: { type: request.guests.type, count: request.guests.count },
                    status: 'pending' as const,
                });
            }
        }

        let finalPrice = expectedTotalPrice;
        if (request.appliedPromotions && request.appliedPromotions.length > 0) {
            let totalDiscount = 0;

            for (const promotionId of request.appliedPromotions) {
                const promotion = await this.promotionRepository.findById(promotionId);
                if (promotion) {
                    totalDiscount += (expectedTotalPrice * promotion.discountPercentage) / 100;
                }
            }

            finalPrice = Math.max(0, expectedTotalPrice - totalDiscount);
        }

        if (Math.abs(request.totalPrice - finalPrice) > 1) {
            throw new BusinessRuleException(
                `Total price should be ${finalPrice} (base: ${expectedTotalPrice}). You provided ${request.totalPrice}.`
            );
        }

        const createdBookings = [];

        for (const bookingData of allBookingsToCreate) {
            BookingValidator.validateCreate(bookingData);
            const createdBooking = await this.bookingRepository.create(bookingData);
            createdBookings.push(createdBooking);
        }

        return {
            bookings: createdBookings.map((booking) => ({
                id: booking._id || '',
                userId: booking.userId,
                hotelId: booking.hotelId,
                roomId: booking.roomType,
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                totalPrice: booking.totalPrice,
                guests: booking.guests,
                status: booking.status,
                createdAt: booking.createdAt || new Date(),
                updatedAt: booking.updatedAt || new Date(),
            })),
            totalRooms: allBookingsToCreate.length,
            totalPrice: request.totalPrice,
        };
    }
}
