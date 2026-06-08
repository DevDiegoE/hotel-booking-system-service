export interface Booking {
    _id?: string;
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
    status: 'pending' | 'confirmed' | 'cancelled' | 'checked-in' | 'completed' | 'no-show';
    assignedRoomIds?: string[];
    paymentStatus?: 'unpaid' | 'partial' | 'paid' | 'refunded';
    source?: 'direct' | 'walk-in' | 'booking.com' | 'expedia' | 'airbnb' | 'other';
    guestProfileId?: string;
    ratePlanId?: string;
    checkInAt?: Date;
    checkOutAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
