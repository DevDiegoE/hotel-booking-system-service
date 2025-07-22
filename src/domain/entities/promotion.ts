export interface Promotion {
    name: string;
    description: string;
    type: 'age-discount' | 'family-discount';
    rules: {
        minAdults?: number;
        freeChildrenUnderAge?: number;
    };
    startDate: Date;
    endDate: Date;
    discountPercentage: number;
    createdAt?: Date;
    updatedAt?: Date;
}
