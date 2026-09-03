import { Test, TestingModule } from '@nestjs/testing';
import { MarketingService } from './marketing.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DiscountType } from '@prisma/client';

describe('MarketingService (Phase 11 — Coupons, Loyalty, Referrals)', () => {
  let service: MarketingService;

  const mockCoupon = {
    id: 'coupon-1',
    code: 'SUMMER20',
    type: DiscountType.PERCENTAGE,
    value: 20,
    minOrderValue: 500,
    maxDiscount: 200,
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2030-12-31'),
    usageLimit: 100,
    usedCount: 5,
    isActive: true,
  };

  const mockOrder = {
    id: 'order-1',
    subtotal: 1698,
    tax: 305.64,
    deliveryFee: 0,
    totalAmount: 2003.64,
    couponId: null,
  };

  const mockPrisma = {
    coupon: {
      findUnique: jest.fn().mockResolvedValue(mockCoupon),
      findMany: jest.fn().mockResolvedValue([mockCoupon]),
      create: jest.fn().mockResolvedValue(mockCoupon),
      update: jest.fn().mockResolvedValue({ ...mockCoupon, isActive: false }),
      delete: jest.fn().mockResolvedValue(mockCoupon),
    },
    order: {
      findUnique: jest.fn().mockResolvedValue(mockOrder),
      findFirst: jest.fn().mockResolvedValue(mockOrder),
      update: jest.fn().mockResolvedValue({
        ...mockOrder,
        discount: 200,
        totalAmount: 1803.64,
      }),
    },
    loyalty: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { points: 500 } }),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'loy-1' }),
    },
    referral: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'ref-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    user: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'referrer-1', firstName: 'John' }),
    },
    product: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'prod-1', name: 'Test Product' }),
      findMany: jest.fn().mockResolvedValue([{ id: 'prod-1' }]),
    },
    subscription: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'sub-1' }),
      update: jest.fn().mockResolvedValue({ id: 'sub-1', status: 'CANCELLED' }),
    },
    bundle: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'bundle-1' }),
      update: jest.fn().mockResolvedValue({ id: 'bundle-1', isActive: false }),
    },
    $transaction: jest.fn().mockImplementation(async (fn) => fn(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MarketingService>(MarketingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('applyCoupon()', () => {
    it('should apply a percentage coupon and calculate discount', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        discount: 200,
        couponId: 'coupon-1',
      });
      mockPrisma.coupon.update.mockResolvedValue({
        ...mockCoupon,
        usedCount: 6,
      });

      const result = await service.applyCoupon({
        code: 'SUMMER20',
        orderId: 'order-1',
      });
      expect(result).toHaveProperty('discount');
      expect(result).toHaveProperty('couponCode', 'SUMMER20');
    });

    it('should throw NotFoundException for inactive coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);
      await expect(
        service.applyCoupon({ code: 'INVALID', orderId: 'order-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for expired coupon', async () => {
      const expiredCoupon = {
        ...mockCoupon,
        validUntil: new Date('2020-01-01'),
      };
      mockPrisma.coupon.findUnique.mockResolvedValue(expiredCoupon);
      await expect(
        service.applyCoupon({ code: 'SUMMER20', orderId: 'order-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when coupon usage limit reached', async () => {
      const maxedCoupon = { ...mockCoupon, usageLimit: 5, usedCount: 5 };
      mockPrisma.coupon.findUnique.mockResolvedValue(maxedCoupon);
      await expect(
        service.applyCoupon({ code: 'SUMMER20', orderId: 'order-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when below minimum order value', async () => {
      const lowValueCoupon = { ...mockCoupon, minOrderValue: 5000 };
      mockPrisma.coupon.findUnique.mockResolvedValue(lowValueCoupon);
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder); // subtotal = 1698 < 5000

      await expect(
        service.applyCoupon({ code: 'SUMMER20', orderId: 'order-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLoyaltyBalance()', () => {
    it('should return loyalty balance and history', async () => {
      mockPrisma.loyalty.aggregate.mockResolvedValue({ _sum: { points: 500 } });
      mockPrisma.loyalty.findMany.mockResolvedValue([]);

      const result = await service.getLoyaltyBalance('user-1');
      expect(result).toHaveProperty('balance', 500);
      expect(result).toHaveProperty('history');
    });
  });

  describe('redeemLoyaltyPoints()', () => {
    it('should redeem loyalty points and reduce order total', async () => {
      mockPrisma.loyalty.aggregate.mockResolvedValue({ _sum: { points: 200 } });
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.loyalty.create.mockResolvedValue({});
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        totalAmount: 1953.64,
      });

      const result = await service.redeemLoyaltyPoints(
        'user-1',
        200,
        'order-1',
      );
      expect(result).toHaveProperty('pointsRedeemed', 200);
      expect(result).toHaveProperty('discountApplied', 50); // 200 * 0.25
    });

    it('should throw BadRequestException if insufficient points', async () => {
      mockPrisma.loyalty.aggregate.mockResolvedValue({ _sum: { points: 100 } });
      await expect(
        service.redeemLoyaltyPoints('user-1', 500, 'order-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('registerReferral()', () => {
    it('should register referral and award loyalty points', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'referrer-1' });
      mockPrisma.referral.findUnique.mockResolvedValue(null); // not referred before
      mockPrisma.referral.create.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'referrer-1',
        refereeId: 'new-user',
      });
      mockPrisma.loyalty.create.mockResolvedValue({ id: 'loy-1' });

      const result = await service.registerReferral('new-user', 'referrer-1');
      expect(result).toHaveProperty('id', 'ref-1');
      expect(mockPrisma.loyalty.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException on self-referral', async () => {
      await expect(
        service.registerReferral('user-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already referred', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'referrer-1' });
      mockPrisma.referral.findUnique.mockResolvedValue({ id: 'existing-ref' }); // already referred

      await expect(
        service.registerReferral('already-referred-user', 'referrer-1'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
