import { Request, Response } from 'express';
import mongoose from 'mongoose';

import { PaymentGatewayService } from '../../../application/services/paymentGatewayService.ts';
import { AuditLogModel } from '../../database/mongoose/auditLogModel.ts';
import { BookingModel } from '../../database/mongoose/bookingModel.ts';
import { GuestProfileModel } from '../../database/mongoose/guestProfileModel.ts';
import { HotelPolicyModel } from '../../database/mongoose/hotelPolicyModel.ts';
import { HousekeepingTaskModel } from '../../database/mongoose/housekeepingTaskModel.ts';
import { NotificationOutboxModel } from '../../database/mongoose/notificationOutboxModel.ts';
import { PaymentModel } from '../../database/mongoose/paymentModel.ts';
import { PhysicalRoomModel } from '../../database/mongoose/physicalRoomModel.ts';
import { RatePlanModel } from '../../database/mongoose/ratePlanModel.ts';

type AuthUser = {
    _id?: unknown;
    id?: string;
    email?: string;
    role?: string;
};

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'checked-in' | 'completed' | 'no-show';

export class OperationsController {
    private readonly paymentGateway = new PaymentGatewayService();

    private param(req: Request, name: string): string {
        return String(req.params[name] || '');
    }

    listCalendar = async (req: Request, res: Response): Promise<Response> => {
        const { from, to, hotelId } = req.query;
        const query: Record<string, unknown> = {
            status: { $nin: ['cancelled', 'no-show'] },
        };

        if (hotelId) {
            query.hotelId = String(hotelId);
        }

        if (from && to) {
            query.checkInDate = { $lt: new Date(String(to)) };
            query.checkOutDate = { $gt: new Date(String(from)) };
        }

        const bookings = await BookingModel.find(query).sort({ checkInDate: 1 }).lean();
        return res.status(200).json(
            bookings.map((booking) => ({
                id: String(booking._id),
                hotelId: booking.hotelId,
                userId: booking.userId,
                status: booking.status,
                paymentStatus: booking.paymentStatus || 'unpaid',
                source: booking.source || 'direct',
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                assignedRoomIds: booking.assignedRoomIds || [],
                roomSelections: booking.roomSelections,
                totalPrice: booking.totalPrice,
                guests: booking.guests,
            }))
        );
    };

    listPhysicalRooms = async (req: Request, res: Response): Promise<Response> => {
        const query = req.query.hotelId ? { hotelId: String(req.query.hotelId) } : {};
        const rooms = await PhysicalRoomModel.find(query).sort({ hotelId: 1, roomNumber: 1 });
        return res.status(200).json(rooms);
    };

    createPhysicalRoom = async (req: Request, res: Response): Promise<Response> => {
        const room = await PhysicalRoomModel.create(req.body);
        await this.audit(req, 'physical-room.created', 'PhysicalRoom', String(room._id), req.body);
        return res.status(201).json(room);
    };

    updatePhysicalRoom = async (req: Request, res: Response): Promise<Response> => {
        const id = this.param(req, 'id');
        const room = await PhysicalRoomModel.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!room) return res.status(404).json({ message: 'Physical room not found' });
        await this.audit(req, 'physical-room.updated', 'PhysicalRoom', id, req.body);
        return res.status(200).json(room);
    };

    assignRooms = async (req: Request, res: Response): Promise<Response> => {
        const booking = await BookingModel.findById(this.param(req, 'bookingId'));
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (['cancelled', 'completed', 'no-show'].includes(booking.status)) {
            return res.status(400).json({ message: `Cannot assign rooms to ${booking.status} booking` });
        }

        const roomIds = this.asStringArray(req.body.roomIds);
        if (roomIds.length === 0) {
            return res.status(400).json({ message: 'At least one room is required' });
        }

        const rooms = await PhysicalRoomModel.find({ _id: { $in: roomIds } });
        if (rooms.length !== roomIds.length) {
            return res.status(400).json({ message: 'One or more rooms do not exist' });
        }

        const unavailableRoom = rooms.find(
            (room) =>
                room.hotelId !== booking.hotelId ||
                room.status === 'maintenance' ||
                (room.currentBookingId && room.currentBookingId !== String(booking._id))
        );
        if (unavailableRoom) {
            return res.status(400).json({
                message: `Room ${unavailableRoom.roomNumber} is not available for this booking`,
            });
        }

        const conflicts = await BookingModel.find({
            _id: { $ne: booking._id },
            assignedRoomIds: { $in: roomIds },
            status: { $nin: ['cancelled', 'completed', 'no-show'] },
            checkInDate: { $lt: booking.checkOutDate },
            checkOutDate: { $gt: booking.checkInDate },
        }).lean();
        if (conflicts.length > 0) {
            return res.status(409).json({ message: 'One or more rooms are already assigned in this date range' });
        }

        booking.assignedRoomIds = roomIds;
        await booking.save();
        await PhysicalRoomModel.updateMany(
            { _id: { $in: roomIds } },
            { $set: { currentBookingId: String(booking._id), status: 'clean' } }
        );
        await this.audit(req, 'booking.rooms-assigned', 'Booking', String(booking._id), { roomIds });

        return res.status(200).json(booking);
    };

    checkIn = async (req: Request, res: Response): Promise<Response> => {
        const booking = await this.transitionBooking(req, 'checked-in', 'booking.checked-in');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        await PhysicalRoomModel.updateMany(
            { _id: { $in: booking.assignedRoomIds || [] } },
            { $set: { status: 'occupied', currentBookingId: String(booking._id) } }
        );
        return res.status(200).json(booking);
    };

    checkOut = async (req: Request, res: Response): Promise<Response> => {
        const booking = await this.transitionBooking(req, 'completed', 'booking.checked-out');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        await PhysicalRoomModel.updateMany(
            { _id: { $in: booking.assignedRoomIds || [] } },
            { $set: { status: 'dirty' }, $unset: { currentBookingId: '' } }
        );
        await this.createHousekeepingAfterCheckout(booking.hotelId, booking.assignedRoomIds || []);
        return res.status(200).json(booking);
    };

    listPayments = async (req: Request, res: Response): Promise<Response> => {
        const query = req.query.bookingId ? { bookingId: String(req.query.bookingId) } : {};
        return res.status(200).json(await PaymentModel.find(query).sort({ createdAt: -1 }));
    };

    createPayment = async (req: Request, res: Response): Promise<Response> => {
        const payment = await PaymentModel.create({
            ...req.body,
            paidAt: ['paid', 'partial'].includes(req.body.status) ? new Date() : undefined,
        });
        await this.syncPaymentStatus(payment.bookingId);
        await this.audit(req, 'payment.created', 'Payment', String(payment._id), req.body);
        return res.status(201).json(payment);
    };

    createGuestPaymentIntent = async (req: Request, res: Response): Promise<Response> => {
        const booking = await BookingModel.findById(req.params.bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (!this.canManageBookingPayment(req, booking.userId)) {
            return res.status(403).json({ message: 'You can only pay your own bookings' });
        }
        if (['cancelled', 'completed', 'no-show'].includes(booking.status)) {
            return res.status(400).json({ message: `Cannot pay a ${booking.status} booking` });
        }

        const amount = Number(req.body.amount ?? booking.totalPrice);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Payment amount must be greater than zero' });
        }
        if (amount + 1 < booking.totalPrice) {
            return res.status(400).json({ message: 'Payment amount cannot be lower than booking total' });
        }

        const method = ['cash', 'card', 'bank-transfer', 'online', 'pay-link'].includes(req.body.method)
            ? req.body.method
            : 'card';
        const guestProfileId = req.body.guestProfileId ? String(req.body.guestProfileId) : undefined;
        const guest = guestProfileId ? await GuestProfileModel.findById(guestProfileId) : null;

        if (method === 'cash') {
            const payment = await PaymentModel.create({
                bookingId: String(booking._id),
                amount,
                currency: req.body.currency || 'USD',
                method,
                status: 'pending',
                provider: 'mock',
                metadata: { guestProfileId },
            });
            if (guestProfileId) await BookingModel.findByIdAndUpdate(booking._id, { guestProfileId });
            await this.syncPaymentStatus(String(booking._id));
            await this.queueBookingNotification(booking, guest?.email, 'payment-pending');
            await this.audit(req, 'payment.intent-created', 'Payment', String(payment._id), { method, amount });
            return res.status(201).json({ payment, clientSecret: null, provider: 'mock', requiresAction: false });
        }

        const intent = await this.paymentGateway.createIntent({
            bookingId: String(booking._id),
            amount,
            currency: req.body.currency || 'USD',
            email: guest?.email,
        });
        const payment = await PaymentModel.create({
            bookingId: String(booking._id),
            amount,
            currency: req.body.currency || 'USD',
            method,
            status: 'authorized',
            provider: intent.provider,
            providerPaymentIntentId: intent.providerPaymentIntentId,
            clientSecret: intent.clientSecret,
            metadata: { guestProfileId },
        });

        if (guestProfileId) await BookingModel.findByIdAndUpdate(booking._id, { guestProfileId });
        await this.audit(req, 'payment.intent-created', 'Payment', String(payment._id), {
            provider: intent.provider,
            method,
            amount,
        });
        return res.status(201).json({ payment, ...intent });
    };

    createGuestCheckoutSession = async (req: Request, res: Response): Promise<Response> => {
        const booking = await BookingModel.findById(req.params.bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (!this.canManageBookingPayment(req, booking.userId)) {
            return res.status(403).json({ message: 'You can only pay your own bookings' });
        }
        if (['cancelled', 'completed', 'no-show'].includes(booking.status)) {
            return res.status(400).json({ message: `Cannot pay a ${booking.status} booking` });
        }

        const existingPayment = await PaymentModel.findOne({
            bookingId: String(booking._id),
            method: 'card',
            status: { $in: ['authorized', 'paid'] },
        }).sort({ createdAt: -1 });
        if (existingPayment?.status === 'paid') {
            return res.status(409).json({ message: 'This booking is already paid' });
        }

        const amount = Number(req.body.amount ?? booking.totalPrice);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Payment amount must be greater than zero' });
        }
        if (amount + 1 < booking.totalPrice) {
            return res.status(400).json({ message: 'Payment amount cannot be lower than booking total' });
        }

        const guestProfileId = req.body.guestProfileId ? String(req.body.guestProfileId) : undefined;
        const guest = guestProfileId ? await GuestProfileModel.findById(guestProfileId) : null;
        const returnUrl = String(req.body.returnUrl || 'http://localhost:4200');
        const baseReturnUrl = returnUrl.replace(/\/$/, '');
        const successUrl = `${req.protocol}://${req.get('host')}/api/v1/operations/payments/checkout-return?session_id={CHECKOUT_SESSION_ID}&return_url=${encodeURIComponent(baseReturnUrl)}`;
        const cancelUrl = `${baseReturnUrl}/my-bookings?payment=cancelled`;
        const session = await this.paymentGateway.createCheckoutSession({
            bookingId: String(booking._id),
            amount,
            currency: req.body.currency || 'USD',
            hotelName: req.body.hotelName || 'Hotel reservation',
            email: guest?.email,
            successUrl,
            cancelUrl,
        });

        const payment = await PaymentModel.create({
            bookingId: String(booking._id),
            amount,
            currency: req.body.currency || 'USD',
            method: 'card',
            status: 'authorized',
            provider: session.provider,
            providerPaymentIntentId: session.providerPaymentIntentId,
            transactionRef: session.checkoutSessionId,
            metadata: { guestProfileId, checkoutSessionId: session.checkoutSessionId },
        });

        if (guestProfileId) await BookingModel.findByIdAndUpdate(booking._id, { guestProfileId });
        await this.audit(req, 'payment.checkout-session-created', 'Payment', String(payment._id), {
            provider: session.provider,
            amount,
        });

        return res.status(201).json({ payment, provider: session.provider, checkoutSessionId: session.checkoutSessionId, url: session.url });
    };

    checkoutReturn = async (req: Request, res: Response): Promise<void> => {
        const checkoutSessionId = String(req.query.session_id || '');
        const returnUrl = String(req.query.return_url || 'http://localhost:4200').replace(/\/$/, '');

        if (!checkoutSessionId) {
            res.redirect(`${returnUrl}/my-bookings?payment=missing-session`);
            return;
        }

        const payment = await PaymentModel.findOne({ providerPaymentIntentId: checkoutSessionId });
        if (!payment) {
            res.redirect(`${returnUrl}/my-bookings?payment=not-found`);
            return;
        }

        const result = await this.paymentGateway.retrieveCheckoutSessionStatus(checkoutSessionId);
        if (!result.paid) {
            payment.status = 'failed';
            payment.failureReason = result.failureReason;
            await payment.save();
            await this.syncPaymentStatus(payment.bookingId);
            res.redirect(`${returnUrl}/my-bookings?payment=failed`);
            return;
        }

        payment.status = 'paid';
        payment.transactionRef = result.transactionRef;
        payment.paidAt = new Date();
        await payment.save();

        await BookingModel.findByIdAndUpdate(payment.bookingId, { status: 'confirmed' });
        await this.syncPaymentStatus(payment.bookingId);
        const booking = await BookingModel.findById(payment.bookingId);
        const guestProfileId = payment.metadata?.guestProfileId
            ? String(payment.metadata.guestProfileId)
            : booking?.guestProfileId;
        const guest = guestProfileId ? await GuestProfileModel.findById(guestProfileId) : null;
        if (booking) {
            await this.queueBookingNotification(booking, guest?.email, 'booking-confirmation');
            await this.queueBookingNotification(booking, guest?.email, 'payment-receipt');
        }
        await AuditLogModel.create({
            actorId: 'stripe-checkout-return',
            actorRole: 'system',
            action: 'payment.checkout-return-confirmed',
            entityType: 'Payment',
            entityId: String(payment._id),
            details: { checkoutSessionId, transactionRef: result.transactionRef },
        });

        res.redirect(`${returnUrl}/my-bookings?payment=success`);
    };

    confirmGuestPayment = async (req: Request, res: Response): Promise<Response> => {
        const payment = await PaymentModel.findById(req.params.paymentId);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        const booking = await BookingModel.findById(payment.bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (!this.canManageBookingPayment(req, booking.userId)) {
            return res.status(403).json({ message: 'You can only confirm payments for your own bookings' });
        }
        if (!payment.providerPaymentIntentId) {
            return res.status(400).json({ message: 'Payment does not have a provider intent' });
        }

        const result = await this.paymentGateway.confirmIntent({
            providerPaymentIntentId: payment.providerPaymentIntentId,
            cardLast4: req.body.cardLast4,
        });

        if (result.status === 'failed') {
            payment.status = 'failed';
            payment.failureReason = result.failureReason;
            await payment.save();
            await this.syncPaymentStatus(payment.bookingId);
            await this.audit(req, 'payment.failed', 'Payment', String(payment._id), {
                reason: result.failureReason,
            });
            return res.status(402).json({ message: result.failureReason || 'Payment failed', payment });
        }

        payment.status = 'paid';
        payment.cardLast4 = req.body.cardLast4;
        payment.transactionRef = result.transactionRef;
        payment.paidAt = new Date();
        await payment.save();

        const updates: Record<string, unknown> = {};
        if (booking.status === 'pending') updates.status = 'confirmed';
        await BookingModel.findByIdAndUpdate(booking._id, updates);
        await this.syncPaymentStatus(payment.bookingId);
        const guestProfileId = payment.metadata?.guestProfileId
            ? String(payment.metadata.guestProfileId)
            : booking.guestProfileId;
        const guest = guestProfileId ? await GuestProfileModel.findById(guestProfileId) : null;
        await this.queueBookingNotification(booking, guest?.email, 'booking-confirmation');
        await this.queueBookingNotification(booking, guest?.email, 'payment-receipt');
        await this.audit(req, 'payment.confirmed', 'Payment', String(payment._id), {
            provider: payment.provider,
            transactionRef: payment.transactionRef,
        });

        return res.status(200).json({ payment, bookingStatus: 'confirmed', paymentStatus: 'paid' });
    };

    paymentWebhook = async (req: Request, res: Response): Promise<Response> => {
        let payload;
        try {
            if (process.env.PAYMENT_PROVIDER !== 'stripe') {
                const signature = req.header('x-hotel-payment-signature');
                const expectedSignature = process.env.PAYMENT_WEBHOOK_SECRET;
                if (expectedSignature && signature !== expectedSignature) {
                    return res.status(401).json({ message: 'Invalid webhook signature' });
                }
            }

            payload = this.paymentGateway.parseWebhookPayload({
                rawBody: (req as Request & { rawBody?: Buffer }).rawBody,
                signature: req.header('stripe-signature'),
                body: req.body,
            });
        } catch (error) {
            return res.status(400).json({
                message: 'Invalid webhook payload',
                error: (error as Error).message,
            });
        }

        const providerPaymentIntentId = payload.providerPaymentIntentId;
        if (!providerPaymentIntentId) {
            return res.status(400).json({ message: 'providerPaymentIntentId is required' });
        }

        const payment = await PaymentModel.findOne({ providerPaymentIntentId });
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        payment.status = payload.status;
        payment.transactionRef = payload.transactionRef || payment.transactionRef;
        payment.failureReason = payload.failureReason;
        payment.paidAt = payment.status === 'paid' ? new Date() : payment.paidAt;
        await payment.save();
        await this.syncPaymentStatus(payment.bookingId);
        if (payment.status === 'paid') {
            await BookingModel.findByIdAndUpdate(payment.bookingId, { status: 'confirmed' });
        }

        await AuditLogModel.create({
            actorId: 'payment-webhook',
            actorRole: 'system',
            action: 'payment.webhook-received',
            entityType: 'Payment',
            entityId: String(payment._id),
            details: payload,
        });
        return res.status(200).json({ received: true });
    };

    createGuestPayment = async (req: Request, res: Response): Promise<Response> => {
        const booking = await BookingModel.findById(req.params.bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (!this.canManageBookingPayment(req, booking.userId)) {
            return res.status(403).json({ message: 'You can only pay your own bookings' });
        }

        if (['cancelled', 'completed', 'no-show'].includes(booking.status)) {
            return res.status(400).json({ message: `Cannot pay a ${booking.status} booking` });
        }

        const amount = Number(req.body.amount ?? booking.totalPrice);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Payment amount must be greater than zero' });
        }

        const method = ['cash', 'card', 'bank-transfer', 'online', 'pay-link'].includes(req.body.method)
            ? req.body.method
            : 'card';
        const status = method === 'cash' ? 'pending' : 'paid';

        const payment = await PaymentModel.create({
            bookingId: String(booking._id),
            amount,
            currency: req.body.currency || 'USD',
            method,
            status,
            transactionRef:
                req.body.transactionRef ||
                `MOCK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(booking._id).slice(-6)}`,
            paidAt: status === 'paid' ? new Date() : undefined,
        });

        const updates: Record<string, unknown> = {};
        if (req.body.guestProfileId) updates.guestProfileId = String(req.body.guestProfileId);
        if (booking.status === 'pending' && status === 'paid') updates.status = 'confirmed';
        if (Object.keys(updates).length) await BookingModel.findByIdAndUpdate(booking._id, updates);

        await this.syncPaymentStatus(String(booking._id));
        const guest = req.body.guestProfileId ? await GuestProfileModel.findById(String(req.body.guestProfileId)) : null;
        await this.queueBookingNotification(
            booking,
            guest?.email,
            status === 'paid' ? 'booking-confirmation' : 'payment-pending'
        );
        await this.audit(req, 'payment.guest-created', 'Payment', String(payment._id), {
            bookingId: String(booking._id),
            method,
            status,
            amount,
        });

        return res.status(201).json(payment);
    };

    updatePayment = async (req: Request, res: Response): Promise<Response> => {
        const id = this.param(req, 'id');
        const payment = await PaymentModel.findByIdAndUpdate(
            id,
            {
                ...req.body,
                paidAt: ['paid', 'partial'].includes(req.body.status) ? new Date() : req.body.paidAt,
            },
            { new: true, runValidators: true }
        );
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        await this.syncPaymentStatus(payment.bookingId);
        await this.audit(req, 'payment.updated', 'Payment', id, req.body);
        return res.status(200).json(payment);
    };

    getPolicy = async (req: Request, res: Response): Promise<Response> => {
        const hotelId = this.param(req, 'hotelId');
        const policy = await HotelPolicyModel.findOneAndUpdate(
            { hotelId },
            { $setOnInsert: { hotelId } },
            { new: true, upsert: true }
        );
        return res.status(200).json(policy);
    };

    upsertPolicy = async (req: Request, res: Response): Promise<Response> => {
        const hotelId = this.param(req, 'hotelId');
        const policy = await HotelPolicyModel.findOneAndUpdate(
            { hotelId },
            { ...req.body, hotelId },
            { new: true, upsert: true, runValidators: true }
        );
        await this.audit(req, 'policy.updated', 'HotelPolicy', hotelId, req.body);
        return res.status(200).json(policy);
    };

    listGuests = async (_req: Request, res: Response): Promise<Response> => {
        return res.status(200).json(await GuestProfileModel.find().sort({ updatedAt: -1 }));
    };

    upsertOwnGuest = async (req: Request, res: Response): Promise<Response> => {
        const user = req.user as AuthUser | undefined;
        const userId = this.currentUserId(req);
        const email = String(req.body.email || user?.email || '').trim().toLowerCase();
        const fullName = String(req.body.fullName || '').trim();

        if (!fullName || !email) {
            return res.status(400).json({ message: 'Guest full name and email are required' });
        }

        const guest = await GuestProfileModel.findOneAndUpdate(
            { $or: [{ userId }, { email }] },
            {
                userId,
                fullName,
                email,
                phone: req.body.phone,
                documentId: req.body.documentId,
                country: req.body.country,
                preferences: req.body.preferences,
                notes: req.body.notes,
            },
            { new: true, upsert: true, runValidators: true }
        );

        await this.audit(req, 'guest.self-upserted', 'GuestProfile', String(guest._id), { email });
        return res.status(200).json(guest);
    };

    upsertGuest = async (req: Request, res: Response): Promise<Response> => {
        const id = this.param(req, 'id');
        const guest =
            id && mongoose.Types.ObjectId.isValid(id)
                ? await GuestProfileModel.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
                : await GuestProfileModel.create(req.body);
        if (!guest) return res.status(404).json({ message: 'Guest profile not found' });
        await this.audit(req, id ? 'guest.updated' : 'guest.created', 'GuestProfile', String(guest._id), req.body);
        return res.status(id ? 200 : 201).json(guest);
    };

    listRatePlans = async (req: Request, res: Response): Promise<Response> => {
        const query = req.query.hotelId ? { hotelId: String(req.query.hotelId) } : {};
        return res.status(200).json(await RatePlanModel.find(query).sort({ hotelId: 1, name: 1 }));
    };

    listPublicRatePlans = async (req: Request, res: Response): Promise<Response> => {
        const query: Record<string, unknown> = { active: true };
        if (req.query.hotelId) query.hotelId = String(req.query.hotelId);
        return res.status(200).json(await RatePlanModel.find(query).sort({ hotelId: 1, name: 1 }));
    };

    upsertRatePlan = async (req: Request, res: Response): Promise<Response> => {
        const id = this.param(req, 'id');
        const ratePlan =
            id && mongoose.Types.ObjectId.isValid(id)
                ? await RatePlanModel.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
                : await RatePlanModel.create(req.body);
        if (!ratePlan) return res.status(404).json({ message: 'Rate plan not found' });
        await this.audit(req, id ? 'rate-plan.updated' : 'rate-plan.created', 'RatePlan', String(ratePlan._id), req.body);
        return res.status(id ? 200 : 201).json(ratePlan);
    };

    listHousekeeping = async (req: Request, res: Response): Promise<Response> => {
        const query = req.query.hotelId ? { hotelId: String(req.query.hotelId) } : {};
        return res.status(200).json(await HousekeepingTaskModel.find(query).sort({ updatedAt: -1 }));
    };

    createHousekeeping = async (req: Request, res: Response): Promise<Response> => {
        const task = await HousekeepingTaskModel.create(req.body);
        await this.audit(req, 'housekeeping.created', 'HousekeepingTask', String(task._id), req.body);
        return res.status(201).json(task);
    };

    updateHousekeeping = async (req: Request, res: Response): Promise<Response> => {
        const id = this.param(req, 'id');
        const task = await HousekeepingTaskModel.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!task) return res.status(404).json({ message: 'Housekeeping task not found' });
        if (task.status === 'done') {
            await PhysicalRoomModel.findByIdAndUpdate(task.physicalRoomId, { status: 'clean' });
        }
        await this.audit(req, 'housekeeping.updated', 'HousekeepingTask', id, req.body);
        return res.status(200).json(task);
    };

    metrics = async (_req: Request, res: Response): Promise<Response> => {
        const [bookings, rooms, payments, dirtyRooms, openTasks] = await Promise.all([
            BookingModel.find().lean(),
            PhysicalRoomModel.find().lean(),
            PaymentModel.find().lean(),
            PhysicalRoomModel.countDocuments({ status: { $in: ['dirty', 'maintenance'] } }),
            HousekeepingTaskModel.countDocuments({ status: { $in: ['open', 'in-progress', 'blocked'] } }),
        ]);

        const activeBookings = bookings.filter((booking) =>
            ['pending', 'confirmed', 'checked-in'].includes(booking.status)
        );
        const paidRevenue = payments
            .filter((payment) => ['paid', 'partial'].includes(payment.status))
            .reduce((total, payment) => total + payment.amount, 0);
        const occupiedRooms = rooms.filter((room) => room.status === 'occupied').length;
        const totalRoomNights = bookings.reduce((total, booking) => {
            if (['cancelled', 'no-show'].includes(booking.status)) return total;
            return total + this.nights(booking.checkInDate, booking.checkOutDate);
        }, 0);
        const revenue = bookings
            .filter((booking) => !['cancelled', 'no-show'].includes(booking.status))
            .reduce((total, booking) => total + booking.totalPrice, 0);

        return res.status(200).json({
            totalBookings: bookings.length,
            activeBookings: activeBookings.length,
            occupancyRate: rooms.length ? Math.round((occupiedRooms / rooms.length) * 100) : 0,
            revenue,
            paidRevenue,
            averageDailyRate: totalRoomNights ? Math.round((revenue / totalRoomNights) * 100) / 100 : 0,
            revPar: rooms.length ? Math.round((revenue / rooms.length) * 100) / 100 : 0,
            cancellations: bookings.filter((booking) => booking.status === 'cancelled').length,
            dirtyOrMaintenanceRooms: dirtyRooms,
            openHousekeepingTasks: openTasks,
            sourceMix: this.countBy(bookings.map((booking) => booking.source || 'direct')),
            statusMix: this.countBy(bookings.map((booking) => booking.status)),
        });
    };

    listAuditLogs = async (_req: Request, res: Response): Promise<Response> => {
        return res.status(200).json(await AuditLogModel.find().sort({ createdAt: -1 }).limit(100));
    };

    sendBookingNotification = async (req: Request, res: Response): Promise<Response> => {
        const booking = await BookingModel.findById(req.params.bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        await this.audit(req, 'notification.sent', 'Booking', String(booking._id), {
            channel: req.body.channel || 'email',
            type: req.body.type || 'confirmation',
        });
        return res.status(200).json({
            success: true,
            message: `${req.body.type || 'confirmation'} notification queued for booking ${booking._id}`,
        });
    };

    private async transitionBooking(req: Request, status: BookingStatus, action: string) {
        const updates: Record<string, unknown> = { status };
        if (status === 'checked-in') updates.checkInAt = new Date();
        if (status === 'completed') updates.checkOutAt = new Date();
        const booking = await BookingModel.findByIdAndUpdate(req.params.bookingId, updates, { new: true });
        if (booking) await this.audit(req, action, 'Booking', String(booking._id), updates);
        return booking;
    }

    private async syncPaymentStatus(bookingId: string): Promise<void> {
        const [booking, payments] = await Promise.all([
            BookingModel.findById(bookingId),
            PaymentModel.find({ bookingId }),
        ]);
        if (!booking) return;
        const paid = payments
            .filter((payment) => ['paid', 'partial'].includes(payment.status))
            .reduce((total, payment) => total + payment.amount, 0);
        const paymentStatus = paid <= 0 ? 'unpaid' : paid >= booking.totalPrice ? 'paid' : 'partial';
        await BookingModel.findByIdAndUpdate(bookingId, { paymentStatus });
    }

    private async queueBookingNotification(
        booking: { _id: unknown; userId?: string; totalPrice: number; checkInDate: Date; checkOutDate: Date },
        email: string | undefined,
        type: 'booking-confirmation' | 'payment-receipt' | 'payment-pending'
    ): Promise<void> {
        if (!email) return;
        const subjects = {
            'booking-confirmation': 'Your hotel reservation is confirmed',
            'payment-receipt': 'Payment receipt for your hotel reservation',
            'payment-pending': 'Your reservation is pending payment at the hotel',
        };
        await NotificationOutboxModel.create({
            bookingId: String(booking._id),
            userId: booking.userId,
            email,
            type,
            subject: subjects[type],
            body: `Booking ${booking._id} from ${new Date(booking.checkInDate).toISOString().slice(0, 10)} to ${new Date(
                booking.checkOutDate
            )
                .toISOString()
                .slice(0, 10)}. Total: ${booking.totalPrice}.`,
            status: process.env.SMTP_HOST ? 'queued' : 'sent',
            provider: process.env.SMTP_HOST ? 'smtp' : 'mock-email',
            sentAt: process.env.SMTP_HOST ? undefined : new Date(),
        });
    }

    private async createHousekeepingAfterCheckout(hotelId: string, roomIds: string[]): Promise<void> {
        await HousekeepingTaskModel.insertMany(
            roomIds.map((physicalRoomId) => ({
                hotelId,
                physicalRoomId,
                title: 'Clean room after check-out',
                status: 'open',
                priority: 'normal',
                dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
            }))
        );
    }

    private async audit(
        req: Request,
        action: string,
        entityType: string,
        entityId?: string,
        details?: Record<string, unknown>
    ): Promise<void> {
        const user = req.user as AuthUser | undefined;
        await AuditLogModel.create({
            actorId: String(user?._id || user?.id || 'system'),
            actorRole: user?.role,
            action,
            entityType,
            entityId,
            details,
        });
    }

    private asStringArray(value: unknown): string[] {
        return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
    }

    private nights(checkInDate: Date, checkOutDate: Date): number {
        return Math.max(
            1,
            Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000)
        );
    }

    private countBy(values: string[]): Record<string, number> {
        return values.reduce<Record<string, number>>((acc, value) => {
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});
    }

    private currentUserId(req: Request): string {
        const user = req.user as AuthUser | undefined;
        return String(user?._id || user?.id || '');
    }

    private canManageBookingPayment(req: Request, bookingUserId?: string): boolean {
        const user = req.user as AuthUser | undefined;
        return user?.role === 'admin' || bookingUserId === this.currentUserId(req);
    }
}
