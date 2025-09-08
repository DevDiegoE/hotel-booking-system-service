export const VALID_AMENITIES = [
    'wifi',
    'tv',
    'ac',
    'heating',
    'kitchen',
    'bathroom',
    'balcony',
    'parking',
    'gym',
    'pool',
    'spa',
    'restaurant',
    'bar',
    'room-service',
    'laundry',
    'concierge',
    'security',
    'elevator',
    'accessible',
    'pet-friendly',
] as const;

export const ROOM_TYPES = ['single-1', 'single-2', 'single-3', 'suite-2', 'suite-family'] as const;

export type ValidAmenity = (typeof VALID_AMENITIES)[number];
export type RoomType = (typeof ROOM_TYPES)[number];

export const ROOM_TYPE_INFO = {
    'single-1': { label: 'Single Room (1 Bed)', capacity: 1 },
    'single-2': { label: 'Single Room (2 Beds)', capacity: 2 },
    'single-3': { label: 'Single Room (3 Beds)', capacity: 3 },
    'suite-2': { label: 'Suite (2 Beds)', capacity: 2 },
    'suite-family': { label: 'Family Suite', capacity: 4 },
} as const;

export const MAX_AMENITIES_PER_ROOM = 20;
export const MAX_ROOM_PRICE = 5000;
