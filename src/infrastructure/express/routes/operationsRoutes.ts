import { Router } from 'express';

import { authMiddleware, requireRole } from '../middlewares/authMiddleware.ts';
import { OperationsController } from '../controllers/operationsController.ts';

export const operationsRoutes = Router();
const operationsController = new OperationsController();

operationsRoutes.get('/public/policies/:hotelId', operationsController.getPolicy);
operationsRoutes.get('/public/rate-plans', operationsController.listPublicRatePlans);
operationsRoutes.get('/payments/checkout-return', operationsController.checkoutReturn);
operationsRoutes.post('/guest-profiles', authMiddleware, operationsController.upsertOwnGuest);
operationsRoutes.post('/bookings/:bookingId/payment-intents', authMiddleware, operationsController.createGuestPaymentIntent);
operationsRoutes.post('/bookings/:bookingId/checkout-session', authMiddleware, operationsController.createGuestCheckoutSession);
operationsRoutes.post('/bookings/:bookingId/guest-payment', authMiddleware, operationsController.createGuestPayment);
operationsRoutes.post('/payments/:paymentId/confirm', authMiddleware, operationsController.confirmGuestPayment);
operationsRoutes.post('/payments/webhook', operationsController.paymentWebhook);

operationsRoutes.use(authMiddleware, requireRole('admin'));

operationsRoutes.get('/calendar', operationsController.listCalendar);
operationsRoutes.get('/physical-rooms', operationsController.listPhysicalRooms);
operationsRoutes.post('/physical-rooms', operationsController.createPhysicalRoom);
operationsRoutes.put('/physical-rooms/:id', operationsController.updatePhysicalRoom);
operationsRoutes.post('/bookings/:bookingId/assign-rooms', operationsController.assignRooms);
operationsRoutes.post('/bookings/:bookingId/check-in', operationsController.checkIn);
operationsRoutes.post('/bookings/:bookingId/check-out', operationsController.checkOut);
operationsRoutes.post('/bookings/:bookingId/notify', operationsController.sendBookingNotification);
operationsRoutes.get('/payments', operationsController.listPayments);
operationsRoutes.post('/payments', operationsController.createPayment);
operationsRoutes.put('/payments/:id', operationsController.updatePayment);
operationsRoutes.get('/policies/:hotelId', operationsController.getPolicy);
operationsRoutes.put('/policies/:hotelId', operationsController.upsertPolicy);
operationsRoutes.get('/guests', operationsController.listGuests);
operationsRoutes.post('/guests', operationsController.upsertGuest);
operationsRoutes.put('/guests/:id', operationsController.upsertGuest);
operationsRoutes.get('/rate-plans', operationsController.listRatePlans);
operationsRoutes.post('/rate-plans', operationsController.upsertRatePlan);
operationsRoutes.put('/rate-plans/:id', operationsController.upsertRatePlan);
operationsRoutes.get('/housekeeping', operationsController.listHousekeeping);
operationsRoutes.post('/housekeeping', operationsController.createHousekeeping);
operationsRoutes.put('/housekeeping/:id', operationsController.updateHousekeeping);
operationsRoutes.get('/metrics', operationsController.metrics);
operationsRoutes.get('/audit-logs', operationsController.listAuditLogs);
