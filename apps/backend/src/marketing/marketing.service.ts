import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';
import { DiscountType } from '@prisma/client';

@Injectable()
export class MarketingService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Coupons ──────────────────────────────────────────────────────────────

  async createCoupon(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Coupon code already exists');

    return this.prisma.coupon.create({
      data: {
        ...dto,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
    });
  }

  async getAllCoupons() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async toggleCoupon(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    return this.prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });
  }

  async deleteCoupon(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    await this.prisma.coupon.delete({ where: { id } });
    return { message: 'Coupon deleted' };
  }

  /**
   * Validate and apply a coupon to an order.
   * Updates Order.couponId and recalculates Order.discount + totalAmount.
   */
  async applyCoupon(dto: ApplyCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
    if (!coupon || !coupon.isActive) throw new NotFoundException('Coupon not found or inactive');

    // Check validity window
    const now = new Date();
    if (coupon.validUntil && coupon.validUntil < now) {
      throw new BadRequestException('Coupon has expired');
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (order.couponId) throw new BadRequestException('A coupon is already applied to this order');

    // Check minimum order value
    if (coupon.minOrderValue && order.subtotal < coupon.minOrderValue) {
      throw new BadRequestException(
        `Minimum order value for this coupon is ₹${coupon.minOrderValue}`,
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === DiscountType.PERCENTAGE) {
      discount = parseFloat(((order.subtotal * coupon.value) / 100).toFixed(2));
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.value;
    }

    const newTotal = parseFloat(
      Math.max(0, order.subtotal + order.tax + order.deliveryFee - discount).toFixed(2),
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: dto.orderId },
        data: { couponId: coupon.id, discount, totalAmount: newTotal },
      });

      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });

      return { order: updated, discount, couponCode: coupon.code };
    });
  }

  // ─── Bundles ──────────────────────────────────────────────────────────────

  async createBundle(dto: CreateBundleDto) {
    const { items, ...bundleData } = dto;

    return this.prisma.bundle.create({
      data: {
        ...bundleData,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });
  }

  async getAllBundles() {
    return this.prisma.bundle.findMany({
      where: { isActive: true },
      include: { items: { include: { product: { include: { images: true } } } } },
      orderBy: { name: 'asc' },
    });
  }

  async getBundleBySlug(slug: string) {
    const bundle = await this.prisma.bundle.findUnique({
      where: { slug },
      include: { items: { include: { product: { include: { images: true } } } } },
    });
    if (!bundle) throw new NotFoundException('Bundle not found');
    return bundle;
  }

  async toggleBundle(id: string) {
    const bundle = await this.prisma.bundle.findUnique({ where: { id } });
    if (!bundle) throw new NotFoundException('Bundle not found');
    return this.prisma.bundle.update({ where: { id }, data: { isActive: !bundle.isActive } });
  }

  // ─── Loyalty ──────────────────────────────────────────────────────────────

  async getLoyaltyBalance(userId: string) {
    const result = await this.prisma.loyalty.aggregate({
      where: { userId },
      _sum: { points: true },
    });
    const history = await this.prisma.loyalty.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { balance: result._sum.points ?? 0, history };
  }

  async redeemLoyaltyPoints(userId: string, points: number, orderId: string) {
    const balance = await this.prisma.loyalty.aggregate({
      where: { userId },
      _sum: { points: true },
    });
    const current = balance._sum.points ?? 0;
    if (current < points) {
      throw new BadRequestException(`Insufficient points. Available: ${current}`);
    }

    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');

    // 1 point = ₹0.25 value
    const discount = parseFloat((points * 0.25).toFixed(2));
    const newTotal = parseFloat(Math.max(0, order.totalAmount - discount).toFixed(2));

    return this.prisma.$transaction(async (tx) => {
      await tx.loyalty.create({
        data: { userId, type: 'REDEEMED', points: -points, description: `Redeemed for order ${orderId}` },
      });
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { discount: order.discount + discount, totalAmount: newTotal },
      });
      return { updated, pointsRedeemed: points, discountApplied: discount };
    });
  }

  // ─── Referrals ────────────────────────────────────────────────────────────

  async getMyReferrals(userId: string) {
    return this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: { referee: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Register a referral during sign-up.
   * The new user (referee) submits the referrer's referral code.
   * A referral code is the referrer's user ID — simple and collision-free.
   * Awards 100 loyalty points to the referrer on success.
   */
  async registerReferral(refereeId: string, referralCode: string) {
    const referrerId = referralCode; // code == referrer's userId

    // Prevent self-referral
    if (referrerId === refereeId) {
      throw new BadRequestException('You cannot refer yourself');
    }

    const referrer = await this.prisma.user.findUnique({ where: { id: referrerId } });
    if (!referrer) throw new NotFoundException('Invalid referral code');

    // Each user can only be referred once
    const existing = await this.prisma.referral.findUnique({ where: { refereeId } });
    if (existing) throw new ConflictException('This account has already been referred');

    return this.prisma.$transaction(async (tx) => {
      const referral = await tx.referral.create({
        data: {
          referrerId,
          refereeId,
          status: 'SUCCESSFUL',
          rewardIssued: true,
        },
      });

      // Award 100 loyalty points to the referrer
      await tx.loyalty.create({
        data: {
          userId: referrerId,
          type: 'EARNED',
          points: 100,
          description: `Referral reward — new user joined`,
        },
      });

      return referral;
    });
  }

  // ─── Subscriptions ────────────────────────────────────────────────────────

  async createSubscription(userId: string, dto: CreateSubscriptionDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.subscription.findFirst({
      where: { userId, productId: dto.productId, status: 'ACTIVE' },
    });
    if (existing) throw new ConflictException('You already have an active subscription for this product');

    const nextBillingDate = this.computeNextBillingDate(dto.interval);

    return this.prisma.subscription.create({
      data: { userId, productId: dto.productId, interval: dto.interval, nextBillingDate },
      include: { product: true },
    });
  }

  async getMySubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: { product: { include: { images: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelSubscription(id: string, userId: string) {
    const sub = await this.prisma.subscription.findFirst({ where: { id, userId } });
    if (!sub) throw new NotFoundException('Subscription not found');
    return this.prisma.subscription.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  private computeNextBillingDate(interval: string): Date {
    const d = new Date();
    if (interval === 'WEEKLY') d.setDate(d.getDate() + 7);
    else if (interval === 'MONTHLY') d.setMonth(d.getMonth() + 1);
    else if (interval === 'QUARTERLY') d.setMonth(d.getMonth() + 3);
    return d;
  }

  // ─── Flash Sales ──────────────────────────────────────────────────────────

  async createFlashSale(dto: CreateFlashSaleDto) {
    const starts = new Date(dto.startsAt);
    const ends = new Date(dto.endsAt);

    if (ends <= starts) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    // Verify all products exist
    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.productIds } },
    });

    if (products.length !== dto.productIds.length) {
      throw new NotFoundException('One or more products not found');
    }

    // Store flash sale as a special coupon with type PERCENTAGE
    // tagged with metadata in the code field so it's identifiable
    const saleCode = `FLASH_${dto.name.toUpperCase().replace(/\s+/g, '_')}_${Date.now()}`;

    return this.prisma.coupon.create({
      data: {
        code: saleCode,
        type: 'PERCENTAGE',
        value: dto.discountPercent,
        validFrom: starts,
        validUntil: ends,
        isActive: true,
      },
    });
  }

  async getActiveFlashSales() {
    const now = new Date();
    return this.prisma.coupon.findMany({
      where: {
        code: { startsWith: 'FLASH_' },
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
    });
  }
}
