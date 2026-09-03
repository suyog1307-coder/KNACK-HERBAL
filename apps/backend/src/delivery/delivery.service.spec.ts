import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryService } from './delivery.service';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleMapsService } from '../integrations/google-maps.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeliveryStatus } from '@prisma/client';

describe('DeliveryService (Phase 12)', () => {
  let service: DeliveryService;

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'KH-ORD-20260903-0001',
    totalAmount: 2003.64,
    status: 'CONFIRMED',
    shippingAddress: {
      street: 'MG Road',
      city: 'Kolhapur',
      state: 'Maharashtra',
      pincode: '416001',
    },
  };

  const mockPartner = {
    id: 'partner-1',
    userId: 'user-dp-1',
    status: 'AVAILABLE',
  };

  const mockDelivery = {
    id: 'delivery-1',
    orderId: 'order-1',
    status: DeliveryStatus.PENDING,
  };

  const mockPrisma = {
    order: {
      findUnique: jest.fn().mockResolvedValue(mockOrder),
      update: jest
        .fn()
        .mockResolvedValue({ ...mockOrder, status: 'DELIVERED' }),
    },
    delivery: {
      findUnique: jest.fn().mockResolvedValue(mockDelivery),
      findMany: jest.fn().mockResolvedValue([mockDelivery]),
      create: jest.fn().mockResolvedValue(mockDelivery),
      update: jest.fn().mockResolvedValue({
        ...mockDelivery,
        status: DeliveryStatus.ASSIGNED,
      }),
    },
    deliveryPartner: {
      findUnique: jest.fn().mockResolvedValue(mockPartner),
      findMany: jest.fn().mockResolvedValue([mockPartner]),
      update: jest.fn().mockResolvedValue({ ...mockPartner, status: 'BUSY' }),
    },
    deliveryAssignment: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({
        id: 'assign-1',
        deliveryId: 'delivery-1',
        partnerId: 'partner-1',
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    tracking: {
      create: jest.fn().mockResolvedValue({ id: 'track-1' }),
    },
    deliveryLocation: {
      create: jest.fn().mockResolvedValue({
        id: 'loc-1',
        latitude: 16.705,
        longitude: 74.2433,
      }),
    },
    orderStatusHistory: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockImplementation(async (fn) => fn(mockPrisma)),
  };

  const mockGoogleMaps = {
    getDistance: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GoogleMapsService, useValue: mockGoogleMaps },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDelivery()', () => {
    it('should create a delivery record for a valid order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.delivery.findUnique.mockResolvedValue(null); // no existing delivery
      mockPrisma.delivery.create.mockResolvedValue(mockDelivery);

      const result = await service.createDelivery({ orderId: 'order-1' });
      expect(result).toHaveProperty('orderId', 'order-1');
    });

    it('should throw NotFoundException for invalid order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      await expect(
        service.createDelivery({ orderId: 'bad-order' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if delivery already exists', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.delivery.findUnique.mockResolvedValue(mockDelivery); // already exists

      await expect(
        service.createDelivery({ orderId: 'order-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('assignPartner()', () => {
    it('should assign delivery partner to delivery', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue(mockDelivery);
      mockPrisma.deliveryPartner.findUnique.mockResolvedValue(mockPartner);
      mockPrisma.deliveryAssignment.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.deliveryAssignment.create.mockResolvedValue({
        id: 'assign-1',
      });
      mockPrisma.deliveryPartner.update.mockResolvedValue({
        ...mockPartner,
        status: 'BUSY',
      });
      mockPrisma.delivery.update.mockResolvedValue({
        ...mockDelivery,
        status: DeliveryStatus.ASSIGNED,
      });

      const result = await service.assignPartner('delivery-1', {
        partnerId: 'partner-1',
      });
      expect(result).toHaveProperty('id', 'assign-1');
    });

    it('should throw NotFoundException for invalid partner', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue(mockDelivery);
      mockPrisma.deliveryPartner.findUnique.mockResolvedValue(null);

      await expect(
        service.assignPartner('delivery-1', { partnerId: 'bad-partner' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDeliveryStatus()', () => {
    it('should update delivery status and add tracking entry', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue(mockDelivery);
      mockPrisma.delivery.update.mockResolvedValue({
        ...mockDelivery,
        status: DeliveryStatus.PICKED_UP,
      });
      mockPrisma.tracking.create.mockResolvedValue({ id: 'track-1' });

      const result = await service.updateDeliveryStatus('delivery-1', {
        status: DeliveryStatus.PICKED_UP,
        location: 'Kolhapur Central',
      });
      expect(result.status).toBe(DeliveryStatus.PICKED_UP);
    });

    it('should mirror DELIVERED status to order', async () => {
      mockPrisma.delivery.findUnique.mockResolvedValue(mockDelivery);
      mockPrisma.delivery.update.mockResolvedValue({
        ...mockDelivery,
        status: DeliveryStatus.DELIVERED,
      });

      await service.updateDeliveryStatus('delivery-1', {
        status: DeliveryStatus.DELIVERED,
        location: 'Customer location',
      });
      // The transaction fn calls order.update with DELIVERED status
      expect(mockPrisma.order.update).toHaveBeenCalled();
    });
  });

  describe('getMyDeliveries()', () => {
    it('should return only assigned deliveries for the delivery partner', async () => {
      mockPrisma.deliveryPartner.findUnique.mockResolvedValue(mockPartner);
      mockPrisma.deliveryAssignment.findMany.mockResolvedValue([]);

      const result = await service.getMyDeliveries('user-dp-1');
      expect(result).toBeInstanceOf(Array);
    });

    it('should throw NotFoundException if delivery partner profile not found', async () => {
      mockPrisma.deliveryPartner.findUnique.mockResolvedValue(null);
      await expect(service.getMyDeliveries('regular-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addLiveLocation() (Phase 13)', () => {
    it('should store GPS coordinates for a delivery', async () => {
      mockPrisma.deliveryPartner.findUnique.mockResolvedValue(mockPartner);
      mockPrisma.delivery.findUnique.mockResolvedValue(mockDelivery);
      mockPrisma.deliveryLocation.create.mockResolvedValue({
        id: 'loc-1',
        latitude: 16.705,
        longitude: 74.2433,
      });

      const result = await service.addLiveLocation('user-dp-1', 'delivery-1', {
        latitude: 16.705,
        longitude: 74.2433,
      });
      expect(result).toHaveProperty('latitude', 16.705);
      expect(result).toHaveProperty('longitude', 74.2433);
    });
  });
});
