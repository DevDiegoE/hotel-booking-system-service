import { HotelValidator } from '../HotelValidator.ts';
import { ValidationException, BusinessRuleException } from '../../exceptions/DomainException.ts';
import { Hotel } from '../../entities/hotel.ts';

describe('HotelValidator', () => {
    describe('validateCreate', () => {
        it('should pass validation for valid hotel data', () => {
            const validHotel: Hotel = {
                name: 'Test Hotel',
                location: 'Test Location',
                description: 'Test Description',
            };

            expect(() => HotelValidator.validateCreate(validHotel)).not.toThrow();
        });

        it('should throw ValidationException for missing name', () => {
            const invalidHotel: Hotel = {
                name: '',
                location: 'Test Location',
            };

            expect(() => HotelValidator.validateCreate(invalidHotel)).toThrow(ValidationException);
            expect(() => HotelValidator.validateCreate(invalidHotel)).toThrow(
                'Hotel name is required'
            );
        });

        it('should throw ValidationException for missing location', () => {
            const invalidHotel: Hotel = {
                name: 'Test Hotel',
                location: '',
            };

            expect(() => HotelValidator.validateCreate(invalidHotel)).toThrow(ValidationException);
            expect(() => HotelValidator.validateCreate(invalidHotel)).toThrow(
                'Hotel location is required'
            );
        });

        it('should throw ValidationException for name too long', () => {
            const invalidHotel: Hotel = {
                name: 'a'.repeat(101),
                location: 'Test Location',
            };

            expect(() => HotelValidator.validateCreate(invalidHotel)).toThrow(ValidationException);
            expect(() => HotelValidator.validateCreate(invalidHotel)).toThrow(
                'Hotel name cannot exceed 100 characters'
            );
        });

        it('should throw ValidationException for location too long', () => {
            const invalidHotel: Hotel = {
                name: 'Test Hotel',
                location: 'a'.repeat(201),
            };

            expect(() => HotelValidator.validateCreate(invalidHotel)).toThrow(ValidationException);
            expect(() => HotelValidator.validateCreate(invalidHotel)).toThrow(
                'Hotel location cannot exceed 200 characters'
            );
        });

        it('should throw ValidationException for description too long', () => {
            const invalidHotel: Hotel = {
                name: 'Test Hotel',
                location: 'Test Location',
                description: 'a'.repeat(1001),
            };

            expect(() => HotelValidator.validateCreate(invalidHotel)).toThrow(ValidationException);
            expect(() => HotelValidator.validateCreate(invalidHotel)).toThrow(
                'Hotel description cannot exceed 1000 characters'
            );
        });
    });

    describe('validateUpdate', () => {
        it('should pass validation for valid update data', () => {
            const validUpdate = {
                name: 'Updated Hotel',
                location: 'Updated Location',
            };

            expect(() => HotelValidator.validateUpdate(validUpdate)).not.toThrow();
        });

        it('should throw ValidationException for empty name in update', () => {
            const invalidUpdate = {
                name: '',
            };

            expect(() => HotelValidator.validateUpdate(invalidUpdate)).toThrow(ValidationException);
            expect(() => HotelValidator.validateUpdate(invalidUpdate)).toThrow(
                'Hotel name cannot be empty'
            );
        });

        it('should throw ValidationException for name too long in update', () => {
            const invalidUpdate = {
                name: 'a'.repeat(101),
            };

            expect(() => HotelValidator.validateUpdate(invalidUpdate)).toThrow(ValidationException);
            expect(() => HotelValidator.validateUpdate(invalidUpdate)).toThrow(
                'Hotel name cannot exceed 100 characters'
            );
        });

        it('should pass validation for partial update with only description', () => {
            const validUpdate = {
                description: 'Updated description',
            };

            expect(() => HotelValidator.validateUpdate(validUpdate)).not.toThrow();
        });
    });
});
