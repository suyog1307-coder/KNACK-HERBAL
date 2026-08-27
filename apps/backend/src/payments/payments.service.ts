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

  // ─── Admin / lookup helpers ──────────────────────────────────────────────

  /** Get all payment records for a given order (admin or owner) */
  async getPaymentsForOrder(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      include: { transactions: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
