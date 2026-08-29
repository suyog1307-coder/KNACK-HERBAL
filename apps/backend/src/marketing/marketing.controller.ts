import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { MarketingService } from './marketing.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';
import { RegisterReferralDto } from './dto/register-referral.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  // ─── Coupons (Admin) ──────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Create a discount coupon' })
  @Roles('ADMIN')
  @Post('coupons')
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.marketingService.createCoupon(dto);
  }

  @ApiOperation({ summary: '[Admin] List all coupons' })
  @Roles('ADMIN')
  @Get('coupons')
  getAllCoupons() {
    return this.marketingService.getAllCoupons();
  }

  @ApiOperation({ summary: '[Admin] Toggle coupon active/inactive' })
  @ApiParam({ name: 'id', description: 'Coupon UUID' })
  @Roles('ADMIN')
  @Patch('coupons/:id/toggle')
  toggleCoupon(@Param('id') id: string) {
    return this.marketingService.toggleCoupon(id);
  }

  @ApiOperation({ summary: '[Admin] Delete a coupon' })
  @ApiParam({ name: 'id', description: 'Coupon UUID' })
  @Roles('ADMIN')
  @Delete('coupons/:id')
  deleteCoupon(@Param('id') id: string) {
    return this.marketingService.deleteCoupon(id);
  }

  // ─── Coupons (Customer) ───────────────────────────────────────────────────

  @ApiOperation({ summary: 'Apply a coupon code to a pending order' })
  @Roles('CUSTOMER')
  @Post('coupons/apply')
  applyCoupon(@Body() dto: ApplyCouponDto) {
    return this.marketingService.applyCoupon(dto);
  }

  // ─── Bundles ──────────────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Create a product bundle' })
  @Roles('ADMIN')
  @Post('bundles')
  createBundle(@Body() dto: CreateBundleDto) {
    return this.marketingService.createBundle(dto);
  }

  @ApiOperation({ summary: 'Get all active bundles (public)' })
  @Roles('CUSTOMER', 'ADMIN')
  @Get('bundles')
  getAllBundles() {
    return this.marketingService.getAllBundles();
  }

  @ApiOperation({ summary: 'Get a bundle by slug' })
  @ApiParam({ name: 'slug', description: 'Bundle slug' })
  @Roles('CUSTOMER', 'ADMIN')
  @Get('bundles/:slug')
  getBundleBySlug(@Param('slug') slug: string) {
    return this.marketingService.getBundleBySlug(slug);
  }

  @ApiOperation({ summary: '[Admin] Toggle bundle active/inactive' })
  @ApiParam({ name: 'id', description: 'Bundle UUID' })
  @Roles('ADMIN')
  @Patch('bundles/:id/toggle')
  toggleBundle(@Param('id') id: string) {
    return this.marketingService.toggleBundle(id);
  }

  // ─── Loyalty ──────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get my loyalty points balance and history' })
  @Roles('CUSTOMER')
  @Get('loyalty')
  getLoyaltyBalance(@Request() req) {
    return this.marketingService.getLoyaltyBalance(req.user.id);
  }

  @ApiOperation({ summary: 'Redeem loyalty points against a pending order' })
  @Roles('CUSTOMER')
  @Post('loyalty/redeem')
  redeemLoyaltyPoints(
    @Request() req,
    @Body() body: { points: number; orderId: string },
  ) {
    return this.marketingService.redeemLoyaltyPoints(req.user.id, body.points, body.orderId);
  }

  // ─── Referrals ────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get my referrals' })
  @Roles('CUSTOMER')
  @Get('referrals')
  getMyReferrals(@Request() req) {
    return this.marketingService.getMyReferrals(req.user.id);
  }

  @ApiOperation({ summary: 'Register a referral using a referral code (call once after sign-up)' })
  @Roles('CUSTOMER')
  @Post('referrals/register')
  registerReferral(@Request() req, @Body() dto: RegisterReferralDto) {
    return this.marketingService.registerReferral(req.user.id, dto.referralCode);
  }

  // ─── Subscriptions ────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Subscribe to a product' })
  @Roles('CUSTOMER')
  @Post('subscriptions')
  createSubscription(@Request() req, @Body() dto: CreateSubscriptionDto) {
    return this.marketingService.createSubscription(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Get my active subscriptions' })
  @Roles('CUSTOMER')
  @Get('subscriptions')
  getMySubscriptions(@Request() req) {
    return this.marketingService.getMySubscriptions(req.user.id);
  }

  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiParam({ name: 'id', description: 'Subscription UUID' })
  @Roles('CUSTOMER')
  @Patch('subscriptions/:id/cancel')
  cancelSubscription(@Param('id') id: string, @Request() req) {
    return this.marketingService.cancelSubscription(id, req.user.id);
  }

  // ─── Flash Sales ──────────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Create a flash sale' })
  @Roles('ADMIN')
  @Post('flash-sales')
  createFlashSale(@Body() dto: CreateFlashSaleDto) {
    return this.marketingService.createFlashSale(dto);
  }

  @ApiOperation({ summary: 'Get all active flash sales' })
  @Roles('CUSTOMER', 'ADMIN')
  @Get('flash-sales')
  getActiveFlashSales() {
    return this.marketingService.getActiveFlashSales();
  }
}
