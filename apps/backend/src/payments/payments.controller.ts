import {
  Controller,
  Post,
  Get,
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

import { PaymentsService } from './payments.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─── Authenticated customer routes ──────────────────────────────────────

  @ApiOperation({
    summary: 'Initiate a Razorpay payment for an existing pending order',
  })
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  @Post('create/:orderId')
  createRazorpayOrder(
    @Request() req,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.createRazorpayOrder(orderId, req.user.sub);
  }

  // ─── Public endpoint (called by frontend after Razorpay success) ─────────

  @ApiOperation({
    summary:
      'Verify Razorpay payment signature and confirm the order (public — called by frontend)',
  })
  @Post('verify')
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(
      dto.razorpay_signature,
      dto.razorpay_payment_id,
      dto.razorpay_order_id,
    );
  }

  // ─── Shared (owner or admin) ─────────────────────────────────────────────

  @ApiOperation({ summary: 'Get payment details for an order' })
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  getPaymentsForOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentsForOrder(orderId);
  }
}
