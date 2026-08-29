import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import * as crypto from 'crypto';

// Razorpay ships a CommonJS default export; the `* as` import works with esModuleInterop.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Razorpay = require('razorpay');

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Defer Razorpay SDK instantiation to module init so that:
   * 1. The app boots cleanly even when keys aren't yet set in .env (dev/CI).
   * 2. We get a clear error message at startup rather than a cryptic crash.
   */
  onModuleInit() {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      this.logger.warn(
        'RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not set. ' +
          'Payment endpoints will fail at runtime until keys are configured.',
      );
      return;
    }

    this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    this.logger.log('Razorpay SDK initialised');
  }

  /** Guard used before any Razorpay call to give a meaningful error */
  private ensureRazorpay() {
    if (!this.razorpay) {
      throw new InternalServerErrorException(
        'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.',
      );
    }
  }

  // ─── Initiate payment ────────────────────────────────────────────────────

  /**
   * Create a Razorpay order for an existing PENDING order.
   *
   * Stores the resulting Razorpay order ID in a Payment record so we can
   * look it up during verification. Returns the Razorpay order object which
   * the frontend passes to Razorpay Checkout.
   */
  async createRazorpayOrder(orderId: string, userId: string) {
    this.ensureRazorpay();
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Order is in "${order.status}" status and cannot be paid`,
      );
    }

    // Amount in paise (Razorpay requires smallest currency unit)
    const amountInPaise = Math.round(order.totalAmount * 100);

    let razorpayOrder: any;
    try {
      razorpayOrder = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${order.orderNumber}`,
      });
    } catch (err) {
      this.logger.error('Razorpay order creation failed', err);
      throw new InternalServerErrorException('Payment gateway error. Please try again.');
    }

    // Persist a Payment record (PENDING) linked to this Razorpay order
    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        currency: 'INR',
        status: PaymentStatus.PENDING,
        provider: 'RAZORPAY',
        providerId: razorpayOrder.id, // Razorpay order ID stored here
      },
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: this.config.get<string>('RAZORPAY_KEY_ID'),
      orderNumber: order.orderNumber,
    };
  }

  // ─── Verify & confirm payment ────────────────────────────────────────────

  /**
   * Verify the HMAC signature returned by Razorpay after a successful payment.
   *
   * On success:
   *  1. Update Payment → SUCCESS and record a PaymentTransaction
   *  2. Update Order → CONFIRMED
   *  3. Append an OrderStatusHistory entry
   */
  async verifyPayment(
    razorpaySignature: string,
    razorpayPaymentId: string,
    razorpayOrderId: string,
  ) {
    // 1. Verify HMAC-SHA256 signature
    const keySecret = this.config.getOrThrow<string>('RAZORPAY_KEY_SECRET');
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new BadRequestException('Payment signature verification failed');
    }

    // 2. Find the Payment record by Razorpay order ID (stored in providerId)
    const payment = await this.prisma.payment.findFirst({
      where: { providerId: razorpayOrderId },
      include: { order: { include: { items: true } } },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found for this Razorpay order');
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      // Idempotent — already processed (e.g. duplicate webhook / retry)
      return { success: true, message: 'Payment already confirmed' };
    }

    // 3. Persist everything in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Update the Payment record
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          method: PaymentMethod.UPI, // Default; webhook can refine this later
        },
      });

      // Record the transaction detail
      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          providerTxnId: razorpayPaymentId,
          status: 'captured',
          amount: payment.amount,
        },
      });

      // Confirm the order
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.CONFIRMED },
      });

      // Append status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.CONFIRMED,
          notes: `Payment captured. Razorpay txn: ${razorpayPaymentId}`,
        },
      });
    });

    return { success: true, message: 'Payment verified and order confirmed' };
  }

  // ─── Admin / lookup helpers ───────────────────────────────────────────────

  /** Get all payment records for a given order (admin or owner) */
  async getPaymentsForOrder(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      include: { transactions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Refunds ──────────────────────────────────────────────────────────────

  /**
   * Initiate a refund via Razorpay and record it in the database.
   * Partial refunds are supported — amount must be ≤ original payment amount.
   */
  async initiateRefund(paymentId: string, amount: number, reason?: string) {
    this.ensureRazorpay();

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { transactions: true, order: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('Only successful payments can be refunded');
    }

    if (amount > payment.amount) {
      throw new BadRequestException(
        `Refund amount (₹${amount}) exceeds original payment (₹${payment.amount})`,
      );
    }

    // The Razorpay payment ID is stored as providerTxnId on the PaymentTransaction
    const txn = payment.transactions.find((t) => t.providerTxnId);
    if (!txn?.providerTxnId) {
      throw new BadRequestException('No Razorpay transaction ID found for this payment');
    }

    let razorpayRefund: any;
    try {
      razorpayRefund = await this.razorpay.payments.refund(txn.providerTxnId, {
        amount: Math.round(amount * 100), // paise
        speed: 'normal',
        notes: { reason: reason ?? 'Refund requested' },
      });
    } catch (err) {
      this.logger.error('Razorpay refund failed', err);
      throw new InternalServerErrorException('Refund gateway error. Please try again.');
    }

    return this.prisma.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          paymentId,
          orderId: payment.orderId,
          amount,
          reason,
          status: 'PENDING',
          providerRefundId: razorpayRefund.id,
        },
      });

      // Update order to REFUND_PENDING
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.REFUND_PENDING },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.REFUND_PENDING,
          notes: `Refund of ₹${amount} initiated. Razorpay refund: ${razorpayRefund.id}`,
        },
      });

      return refund;
    });
  }

  // ─── Razorpay Webhook ────────────────────────────────────────────────────

  /**
   * Handle Razorpay webhook events.
   * Verify signature using the webhook secret (RAZORPAY_WEBHOOK_SECRET env var).
   * Handles: payment.captured, refund.processed, refund.failed
   */
  async handleWebhook(rawBody: string, signature: string) {
    const webhookSecret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET');

    if (webhookSecret) {
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expected !== signature) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException('Invalid webhook payload');
    }

    const eventType: string = event.event;
    this.logger.log(`Razorpay webhook received: ${eventType}`);

    switch (eventType) {
      case 'payment.captured': {
        const rzpPaymentId: string = event.payload?.payment?.entity?.id;
        const rzpOrderId: string = event.payload?.payment?.entity?.order_id;
        const method: string = event.payload?.payment?.entity?.method;

        if (rzpPaymentId && rzpOrderId) {
          const payment = await this.prisma.payment.findFirst({
            where: { providerId: rzpOrderId },
          });
          if (payment && payment.status !== PaymentStatus.SUCCESS) {
            await this.prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: PaymentStatus.SUCCESS,
                method: this.mapPaymentMethod(method),
              },
            });
          }
        }
        break;
      }

      case 'refund.processed': {
        const rzpRefundId: string = event.payload?.refund?.entity?.id;
        if (rzpRefundId) {
          await this.prisma.refund.updateMany({
            where: { providerRefundId: rzpRefundId },
            data: { status: 'COMPLETED' },
          });

          // Find the order via the refund and mark REFUNDED
          const refund = await this.prisma.refund.findFirst({
            where: { providerRefundId: rzpRefundId },
          });
          if (refund) {
            await this.prisma.order.update({
              where: { id: refund.orderId },
              data: { status: OrderStatus.REFUNDED },
            });
            await this.prisma.orderStatusHistory.create({
              data: {
                orderId: refund.orderId,
                status: OrderStatus.REFUNDED,
                notes: `Refund processed. Razorpay refund: ${rzpRefundId}`,
              },
            });
            // Mark payment as REFUNDED
            await this.prisma.payment.update({
              where: { id: refund.paymentId },
              data: { status: PaymentStatus.REFUNDED },
            });
          }
        }
        break;
      }

      case 'refund.failed': {
        const rzpRefundId: string = event.payload?.refund?.entity?.id;
        if (rzpRefundId) {
          await this.prisma.refund.updateMany({
            where: { providerRefundId: rzpRefundId },
            data: { status: 'FAILED' },
          });
        }
        break;
      }

      default:
        this.logger.debug(`Unhandled webhook event: ${eventType}`);
    }

    return { received: true };
  }

  private mapPaymentMethod(method: string): PaymentMethod {
    const map: Record<string, PaymentMethod> = {
      upi: PaymentMethod.UPI,
      card: PaymentMethod.CARD,
      netbanking: PaymentMethod.NETBANKING,
      wallet: PaymentMethod.WALLET,
    };
    return map[method?.toLowerCase()] ?? PaymentMethod.UPI;
  }
}
