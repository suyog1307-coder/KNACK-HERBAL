import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleMapsService } from '../integrations/google-maps.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { AssignPartnerDto } from './dto/assign-partner.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { UpdatePartnerStatusDto } from './dto/update-partner-status.dto';
import { AddLocationDto } from './dto/add-location.dto';
import { DeliveryStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly maps: GoogleMapsService,
  ) {}

  // ─── Delivery Records ─────────────────────────────────────────────────────

  async createDelivery(dto: CreateDeliveryDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { shippingAddress: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const existing = await this.prisma.delivery.findUnique({ where: { orderId: dto.orderId } });
    if (existing) throw new BadRequestException('Delivery already exists for this order');

    // Try to auto-estimate delivery time via Google Maps
    let estimatedTime: Date | undefined = dto.estimatedTime ? new Date(dto.estimatedTime) : undefined;
    if (!estimatedTime && order.shippingAddress) {
      const dest = `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}`;
      const distance = await this.maps.getDistance('Kolhapur, Maharashtra, India', dest);
      if (distance) {
        estimatedTime = new Date(Date.now() + distance.durationSeconds * 1000);
        this.logger.log(`[Delivery] Estimated time for order ${order.id}: ${distance.durationText}`);
      }
    }

    return this.prisma.delivery.create({
      data: { orderId: dto.orderId, estimatedTime },
      include: { order: true },
    });
  }

  async getDeliveryByOrder(orderId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
      include: {
        assignments: { include: { partner: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } } } },
        tracking: { orderBy: { timestamp: 'asc' } },
        locations: { orderBy: { timestamp: 'desc' }, take: 1 },
      },
    });
    if (!delivery) throw new NotFoundException('Delivery not found for this order');
    return delivery;
  }

  async getAllDeliveries() {
    return this.prisma.delivery.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { orderNumber: true, totalAmount: true } },
        assignments: { where: { status: 'ACTIVE' }, include: { partner: true } },
      },
    });
  }

  async updateDeliveryStatus(deliveryId: string, dto: UpdateDeliveryStatusDto) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: dto.status,
          ...(dto.status === DeliveryStatus.DELIVERED ? { actualTime: new Date() } : {}),
        },
      });

      // Append a tracking entry
      await tx.tracking.create({
        data: {
          deliveryId,
          status: dto.status,
          location: dto.location,
        },
      });

      // Mirror DELIVERED status back to the order
      if (dto.status === DeliveryStatus.DELIVERED) {
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: OrderStatus.DELIVERED },
        });
        await tx.orderStatusHistory.create({
          data: { orderId: delivery.orderId, status: OrderStatus.DELIVERED, notes: 'Delivered by partner' },
        });
      }

      return updated;
    });
  }

  // ─── Partner Assignment ───────────────────────────────────────────────────

  async assignPartner(deliveryId: string, dto: AssignPartnerDto) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');

    const partner = await this.prisma.deliveryPartner.findUnique({ where: { id: dto.partnerId } });
    if (!partner) throw new NotFoundException('Delivery partner not found');

    return this.prisma.$transaction(async (tx) => {
      // Deactivate any existing assignment
      await tx.deliveryAssignment.updateMany({
        where: { deliveryId, status: 'ACTIVE' },
        data: { status: 'REASSIGNED' },
      });

      const assignment = await tx.deliveryAssignment.create({
        data: { deliveryId, partnerId: dto.partnerId },
        include: { partner: { include: { user: { select: { firstName: true, lastName: true } } } } },
      });

      // Set partner as BUSY
      await tx.deliveryPartner.update({
        where: { id: dto.partnerId },
        data: { status: 'BUSY' },
      });

      // Update delivery status to ASSIGNED
      await tx.delivery.update({
        where: { id: deliveryId },
        data: { status: DeliveryStatus.ASSIGNED },
      });

      return assignment;
    });
  }

  // ─── Partner Management ───────────────────────────────────────────────────

  async getMyDeliveries(userId: string) {
    const partner = await this.prisma.deliveryPartner.findUnique({ where: { userId } });
    if (!partner) throw new NotFoundException('Delivery partner profile not found');

    return this.prisma.deliveryAssignment.findMany({
      where: { partnerId: partner.id, status: 'ACTIVE' },
      include: {
        delivery: {
          include: {
            order: {
              include: { shippingAddress: true, items: { include: { product: true } } },
            },
            tracking: { orderBy: { timestamp: 'desc' }, take: 1 },
          },
        },
      },
    });
  }

  async updatePartnerStatus(userId: string, dto: UpdatePartnerStatusDto) {
    const partner = await this.prisma.deliveryPartner.findUnique({ where: { userId } });
    if (!partner) throw new NotFoundException('Delivery partner profile not found');

    return this.prisma.deliveryPartner.update({
      where: { userId },
      data: { status: dto.status },
    });
  }

  async addLiveLocation(userId: string, deliveryId: string, dto: AddLocationDto) {
    const partner = await this.prisma.deliveryPartner.findUnique({ where: { userId } });
    if (!partner) throw new NotFoundException('Delivery partner profile not found');

    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');

    return this.prisma.deliveryLocation.create({
      data: { deliveryId, ...dto },
    });
  }

  async getAllPartners() {
    return this.prisma.deliveryPartner.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
