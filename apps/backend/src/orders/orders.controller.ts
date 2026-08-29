import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ─── Customer routes ──────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Convert active cart into a new pending order' })
  @Roles('CUSTOMER')
  @Post()
  createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrderFromCart(req.user.sub, dto.addressId);
  }

  @ApiOperation({ summary: 'Get all orders for the authenticated customer' })
  @Roles('CUSTOMER')
  @Get('my-orders')
  getMyOrders(@Request() req) {
    return this.ordersService.getMyOrders(req.user.sub);
  }

  @ApiOperation({ summary: 'Get a specific order (must belong to the customer)' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @Roles('CUSTOMER')
  @Get('my-orders/:id')
  getOrderById(@Param('id') id: string, @Request() req) {
    return this.ordersService.getOrderById(id, req.user.sub);
  }

  @ApiOperation({ summary: 'Cancel a pending or confirmed order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @Roles('CUSTOMER')
  @Patch('my-orders/:id/cancel')
  cancelOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.cancelOrder(id, req.user.sub);
  }

  @ApiOperation({ summary: 'Request a return on a delivered order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @Roles('CUSTOMER')
  @Patch('my-orders/:id/return')
  requestReturn(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: { reason: string },
  ) {
    return this.ordersService.requestReturn(id, req.user.sub, dto.reason);
  }

  // ─── Admin routes ─────────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] List all orders' })
  @Roles('ADMIN')
  @Get()
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @ApiOperation({ summary: '[Admin] Update the status of an order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateOrderStatus(id, dto.status);
  }
}
