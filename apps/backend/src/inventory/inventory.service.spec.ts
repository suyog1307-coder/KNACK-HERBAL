import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('InventoryService (Phase 10)', () => {
  let service: InventoryService;

  const mockProduct = { id: 'prod-1', name: 'Goat Milk Lotion' };
  const mockSupplier = { id: 'supplier-1', name: 'Test Supplier' };
  const mockInventory = {
    id: 'inv-1',
    productId: 'prod-1',
    supplierId: 'supplier-1',
  };
  const mockStockAlert = {
    id: 'alert-1',
    productId: 'prod-1',
    threshold: 10,
    isActive: true,
    product: mockProduct,
  };

  const mockPrisma = {
    product: { findUnique: jest.fn().mockResolvedValue(mockProduct) },
    supplier: {
      create: jest.fn().mockResolvedValue(mockSupplier),
      findMany: jest.fn().mockResolvedValue([mockSupplier]),
      findUnique: jest.fn().mockResolvedValue(mockSupplier),
      update: jest.fn().mockResolvedValue(mockSupplier),
      delete: jest.fn().mockResolvedValue(mockSupplier),
    },
    inventory: {
      create: jest.fn().mockResolvedValue(mockInventory),
      findMany: jest.fn().mockResolvedValue([mockInventory]),
      findUnique: jest.fn().mockResolvedValue(mockInventory),
    },
    inventoryTransaction: {
      create: jest.fn().mockResolvedValue({ id: 'tx-1', quantity: 10 }),
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 50 } }),
    },
    stockAlert: {
      create: jest.fn().mockResolvedValue(mockStockAlert),
      findMany: jest.fn().mockResolvedValue([mockStockAlert]),
      findUnique: jest.fn().mockResolvedValue(mockStockAlert),
      delete: jest.fn().mockResolvedValue(mockStockAlert),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStockLevel()', () => {
    it('should return current net stock level', async () => {
      mockPrisma.inventoryTransaction.aggregate.mockResolvedValue({
        _sum: { quantity: 50 },
      });
      const result = await service.getStockLevel('prod-1');
      expect(result).toHaveProperty('netStock', 50);
    });

    it('should return 0 when no transactions exist', async () => {
      mockPrisma.inventoryTransaction.aggregate.mockResolvedValue({
        _sum: { quantity: null },
      });
      const result = await service.getStockLevel('prod-1');
      expect(result.netStock).toBe(0);
    });
  });

  describe('addTransaction()', () => {
    it('should add a PURCHASE transaction (positive)', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(mockInventory);
      const result = await service.addTransaction('inv-1', {
        type: 'PURCHASE',
        quantity: 100,
        reason: 'Stock replenishment',
      });
      expect(result).toHaveProperty('id');
      expect(mockPrisma.inventoryTransaction.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when selling beyond available stock', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(mockInventory);
      mockPrisma.inventoryTransaction.aggregate.mockResolvedValue({
        _sum: { quantity: 5 },
      });

      await expect(
        service.addTransaction('inv-1', {
          type: 'SALE' as any,
          quantity: -10,
          reason: 'Sale',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if inventory not found', async () => {
      mockPrisma.inventory.findUnique.mockResolvedValue(null);
      await expect(
        service.addTransaction('bad-id', {
          type: 'PURCHASE' as any,
          quantity: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActiveStockAlerts()', () => {
    it('should return stock alerts enriched with current stock and threshold status', async () => {
      mockPrisma.stockAlert.findMany.mockResolvedValue([mockStockAlert]);
      mockPrisma.inventoryTransaction.aggregate.mockResolvedValue({
        _sum: { quantity: 4 },
      }); // below threshold of 10

      const result = await service.getActiveStockAlerts();
      expect(result[0]).toHaveProperty('isBelowThreshold', true);
      expect(result[0]).toHaveProperty('currentStock', 4);
    });

    it('should flag stock as LOW when below threshold', async () => {
      mockPrisma.stockAlert.findMany.mockResolvedValue([
        { ...mockStockAlert, threshold: 5 },
      ]);
      mockPrisma.inventoryTransaction.aggregate.mockResolvedValue({
        _sum: { quantity: 3 },
      });

      const result = await service.getActiveStockAlerts();
      expect(result[0].isBelowThreshold).toBe(true);
    });

    it('should not flag when stock is above threshold', async () => {
      mockPrisma.stockAlert.findMany.mockResolvedValue([mockStockAlert]); // threshold = 10
      mockPrisma.inventoryTransaction.aggregate.mockResolvedValue({
        _sum: { quantity: 50 },
      });

      const result = await service.getActiveStockAlerts();
      expect(result[0].isBelowThreshold).toBe(false);
    });
  });

  describe('createStockAlert()', () => {
    it('should create a stock alert for a product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.stockAlert.create.mockResolvedValue(mockStockAlert);

      const result = await service.createStockAlert({
        productId: 'prod-1',
        threshold: 5,
        isActive: true,
      });
      expect(result).toHaveProperty('productId', 'prod-1');
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(
        service.createStockAlert({
          productId: 'bad-id',
          threshold: 5,
          isActive: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
