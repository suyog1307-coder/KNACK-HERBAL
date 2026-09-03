import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

describe('OrdersService (Phase 8)', () => {
  let service: OrdersService;

  const mockAddress = {
    id: 'addr-1',
    userId: 'user-1',
    street: 'MG Road',
    city: 'Kolhapur',
    state: 'Maharashtra',
    pincode: '416001',
    country: 'India',
  };

  const mockProduct = {
    id: 'prod-1',
    name: 'Goat Milk Lotion',
    price: 849,
    inventories: [
      {
        id: 'inv-1',
        transactions: [{ quantity: 100 }], // 100 in stock
      },
    ],
  };

  const mockCart = {
    id: 'cart-1',
    userId: 'user-1',
    items: [
      {
        id: 'ci-1',
        productId: 'prod-1',
        quantity: 2,
        product: mockProduct,
      },
    ],
  };

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'KH-ORD-20260903-0001',
    userId: 'user-1',
    status: OrderStatus.PENDING,
    subtotal: 1698,
    tax: 305.64,
    deliveryFee: 0,
    totalAmount: 2003.64,
    items: [],
    shippingAddress: mockAddress,
  };

  const mockPrisma = {
    address: { findFirst: jest.fn().mockResolvedValue(mockAddress) },
    cart: { findFirst: jest.fn().mockResolvedValue(mockCart) },
    order: {
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(mockOrder),
      findUnique: jest.fn().mockResolvedValue(mockOrder),
      findMany: jest.fn().mockResolvedValue([mockOrder]),
      update: jest
        .fn()
        .mockResolvedValue({ ...mockOrder, status: OrderStatus.CONFIRMED }),
    },
    orderStatusHistory: {
      create: jest.fn().mockResolvedValue({}),
    },
    inventoryTransaction: {
      create: jest.fn().mockResolvedValue({}),
    },
    cartItem: {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ email: 'test@knackherbal.com' }),
    },
    $transaction: jest.fn().mockImplementation(async (fn) => fn(mockPrisma)),
  };

  const mockNotifications = {
    sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
    sendShippingUpdate: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrderFromCart()', () => {
    it('should throw NotFoundException if address not found', async () => {
      mockPrisma.address.findFirst.mockResolvedValue(null);
      await expect(
        service.createOrderFromCart('user-1', 'bad-addr'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if cart is empty', async () => {
      mockPrisma.address.findFirst.mockResolvedValue(mockAddress);
      mockPrisma.cart.findFirst.mockResolvedValue({ ...mockCart, items: [] });

      await expect(
        service.createOrderFromCart('user-1', 'addr-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      mockPrisma.address.findFirst.mockResolvedValue(mockAddress);
      mockPrisma.cart.findFirst.mockResolvedValue({
        ...mockCart,
        items: [
          {
            ...mockCart.items[0],
            quantity: 200, // more than 100 in stock
            product: mockProduct,
          },
        ],
      });

      await expect(
        service.createOrderFromCart('user-1', 'addr-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMyOrders()', () => {
    it('should return orders for the authenticated user', async () => {
      mockPrisma.order.findMany.mockResolvedValue([mockOrder]);
      const result = await service.getMyOrders('user-1');
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('orderNumber');
    });
  });

  describe('getOrderById()', () => {
    it('should return order by id for the correct user', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(mockOrder);
      const result = await service.getOrderById('order-1', 'user-1');
      expect(result).toHaveProperty('id', 'order-1');
    });

    it('should throw NotFoundException for wrong user', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);
      await expect(
        service.getOrderById('order-1', 'wrong-user'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelOrder()', () => {
    it('should cancel a PENDING order', async () => {
      const pendingOrder = {
        ...mockOrder,
        status: OrderStatus.PENDING,
        items: [],
      };
      mockPrisma.order.findFirst.mockResolvedValue(pendingOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...pendingOrder,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.cancelOrder('order-1', 'user-1');
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should throw BadRequestException for DELIVERED order cancel', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.DELIVERED,
        items: [],
      });
      await expect(service.cancelOrder('order-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('requestReturn()', () => {
    it('should request return for a DELIVERED order', async () => {
      const deliveredOrder = {
        ...mockOrder,
        status: OrderStatus.DELIVERED,
        items: [],
      };
      mockPrisma.order.findFirst.mockResolvedValue(deliveredOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...deliveredOrder,
        status: OrderStatus.RETURN_REQUESTED,
      });

      const result = await service.requestReturn(
        'order-1',
        'user-1',
        'Product damaged',
      );
      expect(result.status).toBe(OrderStatus.RETURN_REQUESTED);
    });

    it('should throw BadRequestException for non-DELIVERED order', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PENDING,
        items: [],
      });
      await expect(
        service.requestReturn('order-1', 'user-1', 'reason'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should NOT allow Customer A to return Customer B order', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null); // userId check fails
      await expect(
        service.requestReturn('order-1', 'other-user', 'reason'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOrderStatus() — Admin (Phase 11)', () => {
    it('should update order status', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      });

      const result = await service.updateOrderStatus(
        'order-1',
        OrderStatus.CONFIRMED,
        'Confirmed by admin',
      );
      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should throw NotFoundException for non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      await expect(
        service.updateOrderStatus('bad-id', OrderStatus.CONFIRMED),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
