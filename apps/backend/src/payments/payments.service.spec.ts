import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import * as crypto from 'crypto';

describe('PaymentsService (Phase 9)', () => {
  let service: PaymentsService;

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'KH-ORD-20260903-0001',
    userId: 'user-1',
    status: OrderStatus.PENDING,
    totalAmount: 2003.64,
    items: [],
  };

  const mockPayment = {
    id: 'payment-1',
    orderId: 'order-1',
    amount: 2003.64,
    currency: 'INR',
    status: PaymentStatus.PENDING,
    provider: 'RAZORPAY',
    providerId: 'rzp_order_abc123',
    transactions: [
      {
        id: 'txn-1',
        providerTxnId: 'rzp_pay_xyz789',
        status: 'captured',
        amount: 2003.64,
      },
    ],
    order: mockOrder,
  };

  const mockPrisma = {
    order: {
      findFirst: jest.fn().mockResolvedValue(mockOrder),
      findUnique: jest.fn().mockResolvedValue(mockOrder),
      update: jest
        .fn()
        .mockResolvedValue({ ...mockOrder, status: OrderStatus.CONFIRMED }),
    },
    payment: {
      create: jest.fn().mockResolvedValue(mockPayment),
      findFirst: jest.fn().mockResolvedValue(mockPayment),
      findMany: jest.fn().mockResolvedValue([mockPayment]),
      findUnique: jest.fn().mockResolvedValue(mockPayment),
      update: jest
        .fn()
        .mockResolvedValue({ ...mockPayment, status: PaymentStatus.SUCCESS }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    paymentTransaction: {
      create: jest.fn().mockResolvedValue({ id: 'ptxn-1' }),
    },
    orderStatusHistory: {
      create: jest.fn().mockResolvedValue({}),
    },
    refund: {
      create: jest.fn().mockResolvedValue({ id: 'refund-1' }),
      findFirst: jest.fn().mockResolvedValue({
        id: 'refund-1',
        paymentId: 'payment-1',
        orderId: 'order-1',
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: jest.fn().mockImplementation(async (fn) => fn(mockPrisma)),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test_rzp_secret'),
    getOrThrow: jest.fn().mockReturnValue('test_rzp_secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyPayment()', () => {
    it('should verify valid Razorpay signature and confirm order', async () => {
      const keySecret = 'test_rzp_secret';
      const razorpayOrderId = 'rzp_order_abc123';
      const razorpayPaymentId = 'rzp_pay_xyz789';

      // Generate a valid signature
      const validSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      mockConfigService.getOrThrow.mockReturnValue(keySecret);
      mockPrisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PENDING,
        providerId: razorpayOrderId,
      });

      const result = await service.verifyPayment(
        validSignature,
        razorpayPaymentId,
        razorpayOrderId,
      );
      expect(result).toHaveProperty('success', true);
    });

    it('should throw BadRequestException for invalid/tampered signature', async () => {
      mockConfigService.getOrThrow.mockReturnValue('test_rzp_secret');

      await expect(
        service.verifyPayment(
          'invalid-signature',
          'rzp_pay_xyz789',
          'rzp_order_abc123',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle already-processed payment idempotently', async () => {
      const keySecret = 'test_rzp_secret';
      const razorpayOrderId = 'rzp_order_abc123';
      const razorpayPaymentId = 'rzp_pay_xyz789';
      const validSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      mockConfigService.getOrThrow.mockReturnValue(keySecret);
      mockPrisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.SUCCESS, // already paid
      });

      const result = await service.verifyPayment(
        validSignature,
        razorpayPaymentId,
        razorpayOrderId,
      );
      expect(result).toHaveProperty('message', 'Payment already confirmed');
    });

    it('should throw NotFoundException if payment record not found', async () => {
      const keySecret = 'test_rzp_secret';
      const razorpayOrderId = 'rzp_order_notfound';
      const razorpayPaymentId = 'rzp_pay_notfound';
      const validSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      mockConfigService.getOrThrow.mockReturnValue(keySecret);
      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyPayment(
          validSignature,
          razorpayPaymentId,
          razorpayOrderId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPaymentsForOrder()', () => {
    it('should return payments for an order', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([mockPayment]);
      const result = await service.getPaymentsForOrder('order-1');
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('orderId', 'order-1');
    });
  });

  describe('handleWebhook()', () => {
    it('should verify valid webhook signature and process payment.captured', async () => {
      const webhookSecret = 'webhook_secret';
      const body = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'rzp_pay_xyz789',
              order_id: 'rzp_order_abc123',
              method: 'upi',
            },
          },
        },
      });
      const validSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      mockConfigService.get.mockReturnValue(webhookSecret);
      mockPrisma.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PENDING,
      });

      const result = await service.handleWebhook(body, validSig);
      expect(result).toHaveProperty('received', true);
    });

    it('should reject webhook with invalid signature', async () => {
      mockConfigService.get.mockReturnValue('webhook_secret');
      await expect(
        service.handleWebhook('{"event":"payment.captured"}', 'invalid-sig'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
