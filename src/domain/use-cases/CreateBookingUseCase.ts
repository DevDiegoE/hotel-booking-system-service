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
        roomType: string;
        quantity: number;
        checkInDate: Date;
        checkOutDate: Date;
        totalPrice: number;
        guests: {
            type: 'adult' | 'child';
            count: number;
        };
        status: 'pending' | 'confirmed' | 'cancelled' | 'checked-in' | 'completed' | 'no-show';
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

        let expectedTotalPrice = 0;
        const validatedRoomSelections = [];

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
            const occupiedCount = conflictingBookings
                .filter((b) => b.status !== 'cancelled' && b.hotelId === request.hotelId)
                .reduce((total, booking) => {
                    if (booking.roomSelections) {
                        const roomSelection = booking.roomSelections.find(
                            (rs) => rs.roomType === selection.roomType
                        );
                        return total + (roomSelection?.quantity || 0);
                    } else {
                        return (
                            total +
                            ((booking as any).roomType === selection.roomType
                                ? (booking as any).quantity || 1
                                : 0)
                        );
                    }
                }, 0);

            const availableCount = roomType.totalRooms - occupiedCount;

            if (availableCount < selection.quantity) {
                throw new BusinessRuleException(
                    `Only ${availableCount} rooms of type ${selection.roomType} available for the selected dates. You requested ${selection.quantity}.`
                );
            }

            const stayDuration = request.checkOutDate.getTime() - request.checkInDate.getTime();
            const days = Math.ceil(stayDuration / (1000 * 60 * 60 * 24));
            let pricePerRoom = roomType.basePrice * days;

            if (selection.quantity >= 3) {
                pricePerRoom = pricePerRoom * 0.9;
            }

            expectedTotalPrice += pricePerRoom * selection.quantity;
            validatedRoomSelections.push(selection);
        }

        const bookingToCreate: Booking = {
            userId: request.userId,
            hotelId: request.hotelId,
            roomSelections: validatedRoomSelections,
            checkInDate: request.checkInDate,
            checkOutDate: request.checkOutDate,
            totalPrice: expectedTotalPrice,
            guests: { type: request.guests.type, count: request.guests.count },
            status: 'pending' as const,
        };

        let finalPrice = expectedTotalPrice;
        let totalDiscount = 0;

        if (request.appliedPromotions && request.appliedPromotions.length > 0) {
            for (const promotionId of request.appliedPromotions) {
                const promotion = await this.promotionRepository.findById(promotionId);
                if (promotion) {
                    totalDiscount += (expectedTotalPrice * promotion.discountPercentage) / 100;
                }
            }

            finalPrice = Math.max(0, expectedTotalPrice - totalDiscount);
        }

        if (request.totalPrice + 1 < finalPrice) {
            throw new BusinessRuleException(
                `Total price cannot be lower than ${finalPrice} (base: ${expectedTotalPrice}). You provided ${request.totalPrice}.`
            );
        }

        bookingToCreate.totalPrice = Math.round(request.totalPrice * 100) / 100;

        BookingValidator.validateCreate(bookingToCreate);
        const createdBooking = await this.bookingRepository.create(bookingToCreate);

        return {
            bookings: [
                {
                    id: createdBooking._id || '',
                    userId: createdBooking.userId,
                    hotelId: createdBooking.hotelId,
                    roomId: createdBooking._id || '',
                    roomType: createdBooking.roomSelections[0]?.roomType || 'single-1',
                    quantity: createdBooking.roomSelections.reduce(
                        (total, rs) => total + rs.quantity,
                        0
                    ),
                    checkInDate: createdBooking.checkInDate,
                    checkOutDate: createdBooking.checkOutDate,
                    totalPrice: createdBooking.totalPrice,
                    guests: createdBooking.guests,
                    status: createdBooking.status,
                    createdAt: createdBooking.createdAt || new Date(),
                    updatedAt: createdBooking.updatedAt || new Date(),
                },
            ],
            totalRooms: validatedRoomSelections.reduce((total, rs) => total + rs.quantity, 0),
            totalPrice: request.totalPrice,
        };
    }
}
