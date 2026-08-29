import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Headers,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { InitiateRefundDto } from './dto/initiate-refund.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─── Customer: initiate payment ───────────────────────────────────────────

  @ApiOperation({ summary: 'Initiate a Razorpay payment for a pending order' })
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @Post('create/:orderId')
  createRazorpayOrder(@Request() req, @Param('orderId') orderId: string) {
    return this.paymentsService.createRazorpayOrder(orderId, req.user.sub);
  }

  // ─── Public: verify payment (called by frontend after Razorpay success) ───

  @ApiOperation({ summary: 'Verify Razorpay payment signature and confirm order' })
  @Post('verify')
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(
      dto.razorpay_signature,
      dto.razorpay_payment_id,
      dto.razorpay_order_id,
    );
  }

  // ─── Public: Razorpay webhook ─────────────────────────────────────────────

  @ApiOperation({ summary: 'Razorpay webhook endpoint — do not call manually' })
  @Post('webhook')
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = (req as any).rawBody?.toString('utf8') ?? JSON.stringify((req as any).body);
    return this.paymentsService.handleWebhook(rawBody, signature);
  }

  // ─── Admin: initiate refund ───────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Initiate a refund for a successful payment' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('refund')
  initiateRefund(@Body() dto: InitiateRefundDto) {
    return this.paymentsService.initiateRefund(dto.paymentId, dto.amount, dto.reason);
  }

  // ─── Shared: get payments for an order ───────────────────────────────────

  @ApiOperation({ summary: 'Get payment details for an order' })
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  getPaymentsForOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentsForOrder(orderId);
  }
}
