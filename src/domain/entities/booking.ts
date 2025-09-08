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
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt?: Date;
    updatedAt?: Date;
}
