import Stripe from 'stripe';
import { requireStripeConfig } from '../../../config/env.ts';

export type PaymentGatewayProvider = 'mock' | 'stripe';

export type PaymentIntentResult = {
    provider: PaymentGatewayProvider;
    providerPaymentIntentId: string;
    clientSecret: string;
    requiresAction: boolean;
};

export type PaymentConfirmationResult = {
    status: 'paid' | 'failed';
    transactionRef?: string;
    failureReason?: string;
};

export type CheckoutSessionResult = {
    provider: PaymentGatewayProvider;
    providerPaymentIntentId: string;
    checkoutSessionId: string;
    url: string;
};

export type CheckoutSessionStatusResult = {
    paid: boolean;
    transactionRef?: string;
    failureReason?: string;
};

export type PaymentWebhookPayload = {
    providerPaymentIntentId: string;
    status: 'paid' | 'failed';
    transactionRef?: string;
    failureReason?: string;
};

type StripePaymentIntentLike = {
    id: string;
    latest_charge?: string | { id?: string } | null;
    last_payment_error?: {
        message?: string;
    } | null;
};

export class PaymentGatewayService {
    constructor() {
        requireStripeConfig();
    }

    private readonly provider: PaymentGatewayProvider =
        process.env.PAYMENT_PROVIDER === 'stripe' && process.env.STRIPE_SECRET_KEY
            ? 'stripe'
            : 'mock';
    private readonly stripe =
        this.provider === 'stripe'
            ? new Stripe(process.env.STRIPE_SECRET_KEY as string, {
                  apiVersion: '2026-05-27.dahlia',
              })
            : null;

    async createIntent(params: {
        bookingId: string;
        amount: number;
        currency: string;
        email?: string;
    }): Promise<PaymentIntentResult> {
        const cents = Math.round(params.amount * 100);

        if (this.stripe) {
            const intent = await this.stripe.paymentIntents.create({
                amount: cents,
                currency: params.currency.toLowerCase(),
                automatic_payment_methods: { enabled: true },
                receipt_email: params.email,
                metadata: {
                    bookingId: params.bookingId,
                    integration: 'hotel-booking-system',
                },
            });

            return {
                provider: 'stripe',
                providerPaymentIntentId: intent.id,
                clientSecret: intent.client_secret || '',
                requiresAction: intent.status === 'requires_action',
            };
        }

        const prefix = this.provider === 'stripe' ? 'pi_stripe_ready' : 'pi_mock';
        const providerPaymentIntentId = `${prefix}_${params.bookingId.slice(-8)}_${Date.now()}`;

        return {
            provider: this.provider,
            providerPaymentIntentId,
            clientSecret: `${providerPaymentIntentId}_secret_${cents}_${params.currency.toLowerCase()}`,
            requiresAction: false,
        };
    }

    async createCheckoutSession(params: {
        bookingId: string;
        amount: number;
        currency: string;
        hotelName: string;
        email?: string;
        successUrl: string;
        cancelUrl: string;
    }): Promise<CheckoutSessionResult> {
        const cents = Math.round(params.amount * 100);

        if (this.stripe) {
            const session = await this.stripe.checkout.sessions.create({
                mode: 'payment',
                customer_email: params.email,
                line_items: [
                    {
                        quantity: 1,
                        price_data: {
                            currency: params.currency.toLowerCase(),
                            unit_amount: cents,
                            product_data: {
                                name: `Reservation at ${params.hotelName}`,
                            },
                        },
                    },
                ],
                metadata: {
                    bookingId: params.bookingId,
                    integration: 'hotel-booking-system',
                },
                payment_intent_data: {
                    metadata: {
                        bookingId: params.bookingId,
                        integration: 'hotel-booking-system',
                    },
                },
                success_url: params.successUrl,
                cancel_url: params.cancelUrl,
            });

            return {
                provider: 'stripe',
                providerPaymentIntentId: session.id,
                checkoutSessionId: session.id,
                url: session.url || params.cancelUrl,
            };
        }

        const checkoutSessionId = `cs_mock_${params.bookingId.slice(-8)}_${Date.now()}`;
        return {
            provider: this.provider,
            providerPaymentIntentId: checkoutSessionId,
            checkoutSessionId,
            url: params.successUrl.replace('{CHECKOUT_SESSION_ID}', checkoutSessionId),
        };
    }

    async confirmIntent(params: {
        providerPaymentIntentId: string;
        cardLast4?: string;
    }): Promise<PaymentConfirmationResult> {
        if (this.stripe) {
            const intent = await this.stripe.paymentIntents.retrieve(params.providerPaymentIntentId, {
                expand: ['latest_charge'],
            });
            if (intent.status === 'succeeded') {
                const charge = typeof intent.latest_charge === 'object' ? intent.latest_charge : undefined;
                return {
                    status: 'paid',
                    transactionRef: charge?.id || intent.id,
                };
            }

            return {
                status: 'failed',
                failureReason: `Stripe payment is ${intent.status}`,
            };
        }

        if (params.cardLast4 === '0000') {
            return {
                status: 'failed',
                failureReason: 'Card declined by demo gateway',
            };
        }

        return {
            status: 'paid',
            transactionRef: `CH_${params.providerPaymentIntentId.slice(-16)}`,
        };
    }

    async retrieveCheckoutSessionStatus(checkoutSessionId: string): Promise<CheckoutSessionStatusResult> {
        if (this.stripe) {
            const session = await this.stripe.checkout.sessions.retrieve(checkoutSessionId, {
                expand: ['payment_intent'],
            });
            const paymentIntent =
                typeof session.payment_intent === 'object' && session.payment_intent
                    ? session.payment_intent
                    : undefined;

            return {
                paid: session.payment_status === 'paid',
                transactionRef: paymentIntent?.id || session.id,
                failureReason:
                    session.payment_status === 'paid'
                        ? undefined
                        : `Stripe Checkout payment is ${session.payment_status}`,
            };
        }

        return {
            paid: true,
            transactionRef: `CH_${checkoutSessionId.slice(-16)}`,
        };
    }

    parseWebhookPayload(params: {
        rawBody?: Buffer;
        signature?: string;
        body: unknown;
    }): PaymentWebhookPayload {
        if (this.stripe) {
            if (!params.rawBody || !params.signature || !process.env.PAYMENT_WEBHOOK_SECRET) {
                throw new Error('Stripe webhook signature verification is not configured');
            }

            const event = this.stripe.webhooks.constructEvent(
                params.rawBody,
                params.signature,
                process.env.PAYMENT_WEBHOOK_SECRET
            );

            if (event.type !== 'payment_intent.succeeded' && event.type !== 'payment_intent.payment_failed') {
                throw new Error(`Unsupported Stripe webhook event: ${event.type}`);
            }

            const intent = event.data.object as StripePaymentIntentLike;
            const latestCharge =
                typeof intent.latest_charge === 'object'
                    ? intent.latest_charge?.id
                    : intent.latest_charge;
            return {
                providerPaymentIntentId: intent.id,
                status: event.type === 'payment_intent.succeeded' ? 'paid' : 'failed',
                transactionRef: latestCharge || intent.id,
                failureReason: intent.last_payment_error?.message,
            };
        }

        const body = params.body as Record<string, unknown>;
        return {
            providerPaymentIntentId: String(body.providerPaymentIntentId || ''),
            status: body.status === 'failed' ? 'failed' : 'paid',
            transactionRef: body.transactionRef ? String(body.transactionRef) : undefined,
            failureReason: body.failureReason ? String(body.failureReason) : undefined,
        };
    }
}
