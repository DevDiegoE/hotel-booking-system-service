import 'reflect-metadata';
import '../../../../../config/container.ts';

import { bookingRoutes } from '../bookingRoutes.ts';
import { operationsRoutes } from '../operationsRoutes.ts';
import { promotionRoutes } from '../promotionRoutes.ts';

const routePaths = (router: any): string[] =>
    router.stack.filter((layer: any) => layer.route).map((layer: any) => layer.route.path);

describe('Express route order', () => {
    it('keeps booking collection routes before the generic booking id route', () => {
        const paths = routePaths(bookingRoutes);
        const genericIdIndex = paths.indexOf('/:id');

        expect(paths.indexOf('/user/:userId')).toBeLessThan(genericIdIndex);
        expect(paths.indexOf('/user/:userId/details')).toBeLessThan(genericIdIndex);
        expect(paths.indexOf('/availability/:hotelId')).toBeLessThan(genericIdIndex);
        expect(paths.indexOf('/:id/can-cancel')).toBeLessThan(genericIdIndex);
    });

    it('keeps promotion lookup routes before the generic promotion id route', () => {
        const paths = routePaths(promotionRoutes);
        const genericIdIndex = paths.indexOf('/:id');

        expect(paths.indexOf('/name/:name')).toBeLessThan(genericIdIndex);
        expect(paths.indexOf('/type/:type')).toBeLessThan(genericIdIndex);
    });

    it('registers operational hotel workflows', () => {
        const paths = routePaths(operationsRoutes);

        expect(paths).toContain('/calendar');
        expect(paths).toContain('/physical-rooms');
        expect(paths).toContain('/bookings/:bookingId/assign-rooms');
        expect(paths).toContain('/bookings/:bookingId/check-in');
        expect(paths).toContain('/bookings/:bookingId/check-out');
        expect(paths).toContain('/bookings/:bookingId/payment-intents');
        expect(paths).toContain('/payments');
        expect(paths).toContain('/payments/:paymentId/confirm');
        expect(paths).toContain('/payments/webhook');
        expect(paths).toContain('/policies/:hotelId');
        expect(paths).toContain('/rate-plans');
        expect(paths).toContain('/housekeeping');
        expect(paths).toContain('/metrics');
        expect(paths).toContain('/audit-logs');
    });
});
