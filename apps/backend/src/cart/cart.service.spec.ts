import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CartService (Phase 7)', () => {
  let service: CartService;

  const mockProduct = {
    id: 'prod-1',
    name: 'Goat Milk Lotion',
    price: 849,
    sku: 'KHL-GML-001',
    images: [],
  };

  const mockCart = { id: 'cart-1', userId: 'user-1' };

  const mockCartItem = {
    id: 'item-1',
    cartId: 'cart-1',
    productId: 'prod-1',
    quantity: 2,
    product: mockProduct,
  };

  const mockPrisma = {
    cart: {
      findFirst: jest.fn().mockResolvedValue(mockCart),
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue(mockCart),
    },
    cartItem: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    product: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCart()', () => {
    it('should return cart with items for the user', async () => {
      const cartWithItems = {
        ...mockCart,
        items: [mockCartItem],
      };
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cart.findUnique.mockResolvedValue(cartWithItems);

      const result = await service.getCart('user-1');
      expect(result).toHaveProperty('items');
    });

    it('should create a new cart if none exists', async () => {
      mockPrisma.cart.findFirst.mockResolvedValueOnce(null);
      mockPrisma.cart.create.mockResolvedValue(mockCart);
      mockPrisma.cart.findUnique.mockResolvedValue({ ...mockCart, items: [] });

      const result = await service.getCart('user-1');
      expect(mockPrisma.cart.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('addItem()', () => {
    it('should add item to cart', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.findFirst.mockResolvedValue(null);
      mockPrisma.cartItem.upsert.mockResolvedValue(mockCartItem);

      const result = await service.addItem('user-1', {
        productId: 'prod-1',
        quantity: 2,
      });
      expect(result).toHaveProperty('quantity', 2);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(
        service.addItem('user-1', { productId: 'nonexistent', quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeItem()', () => {
    it('should remove an item from the cart', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.findFirst.mockResolvedValue(mockCartItem);
      mockPrisma.cartItem.delete.mockResolvedValue(mockCartItem);

      const result = await service.removeItem('user-1', 'item-1');
      expect(result).toHaveProperty('id', 'item-1');
      expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
    });

    it('should throw NotFoundException if item not in cart', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.findFirst.mockResolvedValue(null);

      await expect(service.removeItem('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateItem()', () => {
    it('should update item quantity', async () => {
      const updatedItem = { ...mockCartItem, quantity: 5 };
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.findFirst.mockResolvedValue(mockCartItem);
      mockPrisma.cartItem.update.mockResolvedValue(updatedItem);

      const result = await service.updateItem('user-1', 'item-1', {
        quantity: 5,
      });
      expect(result).toHaveProperty('quantity', 5);
    });
  });

  describe('clearCart()', () => {
    it('should clear all items from cart', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart);
      mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.clearCart('user-1');
      expect(result).toHaveProperty('success', true);
      expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1' },
      });
    });
  });
});
