import {
  Controller,
  Get,
  Post,
  Patch,
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

import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { AssignPartnerDto } from './dto/assign-partner.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { UpdatePartnerStatusDto } from './dto/update-partner-status.dto';
import { AddLocationDto } from './dto/add-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // ─── Admin routes ─────────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Create a delivery record for an order' })
  @Roles('ADMIN')
  @Post()
  createDelivery(@Body() dto: CreateDeliveryDto) {
    return this.deliveryService.createDelivery(dto);
  }

  @ApiOperation({ summary: '[Admin] List all deliveries' })
  @Roles('ADMIN')
  @Get()
  getAllDeliveries() {
    return this.deliveryService.getAllDeliveries();
  }

  @ApiOperation({ summary: '[Admin] Get all registered delivery partners' })
  @Roles('ADMIN')
  @Get('partners')
  getAllPartners() {
    return this.deliveryService.getAllPartners();
  }

  @ApiOperation({ summary: '[Admin] Assign a delivery partner to a delivery' })
  @ApiParam({ name: 'deliveryId', description: 'Delivery UUID' })
  @Roles('ADMIN')
  @Post(':deliveryId/assign')
  assignPartner(@Param('deliveryId') deliveryId: string, @Body() dto: AssignPartnerDto) {
    return this.deliveryService.assignPartner(deliveryId, dto);
  }

  @ApiOperation({ summary: '[Admin] Update delivery status and add a tracking event' })
  @ApiParam({ name: 'deliveryId', description: 'Delivery UUID' })
  @Roles('ADMIN')
  @Patch(':deliveryId/status')
  updateStatus(@Param('deliveryId') deliveryId: string, @Body() dto: UpdateDeliveryStatusDto) {
    return this.deliveryService.updateDeliveryStatus(deliveryId, dto);
  }

  // ─── Shared: customer can track their own order ───────────────────────────

  @ApiOperation({ summary: 'Get delivery tracking info for an order' })
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  @Roles('CUSTOMER', 'ADMIN')
  @Get('order/:orderId')
  getDeliveryByOrder(@Param('orderId') orderId: string) {
    return this.deliveryService.getDeliveryByOrder(orderId);
  }

  // ─── Delivery partner routes ──────────────────────────────────────────────

  @ApiOperation({ summary: '[Partner] Get my active delivery assignments' })
  @Roles('DELIVERY_PARTNER')
  @Get('my-deliveries')
  getMyDeliveries(@Request() req) {
    return this.deliveryService.getMyDeliveries(req.user.id);
  }

  @ApiOperation({ summary: '[Partner] Update my availability status' })
  @Roles('DELIVERY_PARTNER')
  @Patch('my-status')
  updateMyStatus(@Request() req, @Body() dto: UpdatePartnerStatusDto) {
    return this.deliveryService.updatePartnerStatus(req.user.id, dto);
  }

  @ApiOperation({ summary: '[Partner] Push live location for a delivery' })
  @ApiParam({ name: 'deliveryId', description: 'Delivery UUID' })
  @Roles('DELIVERY_PARTNER')
  @Post(':deliveryId/location')
  addLocation(
    @Request() req,
    @Param('deliveryId') deliveryId: string,
    @Body() dto: AddLocationDto,
  ) {
    return this.deliveryService.addLiveLocation(req.user.id, deliveryId, dto);
  }
}
