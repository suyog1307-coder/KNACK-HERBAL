import { Test, TestingModule } from '@nestjs/testing';
import { EnterpriseService } from './enterprise.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EnterpriseService (Phase 11 & 16 — Admin Dashboard, Analytics, Reports)', () => {
  let service: EnterpriseService;

  const mockPrisma = {
    auditLog: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
    activity: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'act-1' }),
    },
    businessMetric: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({ id: 'metric-1' }),
    },
    user: {
      count: jest.fn().mockResolvedValue(42),
    },
    order: {
      count: jest.fn().mockResolvedValue(18),
      aggregate: jest.fn().mockResolvedValue({
        _sum: { totalAmount: 150000 },
        _count: { id: 18 },
      }),
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([]),
    },
    ticket: {
      count: jest.fn().mockResolvedValue(3),
    },
    product: {
      count: jest.fn().mockResolvedValue(5),
      findMany: jest.fn().mockResolvedValue([]),
    },
    orderItem: {
      groupBy: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnterpriseService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EnterpriseService>(EnterpriseService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardSummary() — Phase 11', () => {
    it('should return all admin dashboard metrics', async () => {
      mockPrisma.user.count.mockResolvedValue(42);
      mockPrisma.order.count.mockResolvedValue(18);
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 150000 },
      });
      mockPrisma.ticket.count.mockResolvedValue(3);
      mockPrisma.product.count.mockResolvedValue(2);

      const result = await service.getDashboardSummary();

      expect(result).toHaveProperty('totalUsers', 42);
      expect(result).toHaveProperty('totalOrders', 18);
      expect(result).toHaveProperty('totalRevenue', 150000);
      expect(result).toHaveProperty('pendingOrders');
      expect(result).toHaveProperty('openTickets', 3);
      expect(result).toHaveProperty('lowStockProducts');
    });
  });

  describe('getAuditLogs() — Phase 11', () => {
    it('should return audit logs', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          action: 'CREATE',
          entity: 'Product',
          createdAt: new Date(),
        },
      ]);
      const result = await service.getAuditLogs(50);
      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('action', 'CREATE');
    });
  });

  describe('getSalesReport() — Phase 16', () => {
    it('should return sales report for a date range', async () => {
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: {
          totalAmount: 50000,
          tax: 9000,
          discount: 500,
          deliveryFee: 200,
        },
        _count: { id: 5 },
      });
      mockPrisma.order.groupBy.mockResolvedValue([]);
      mockPrisma.orderItem.groupBy.mockResolvedValue([]);

      const result = await service.getSalesReport('2026-08-01', '2026-08-31');

      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('totalRevenue');
      expect(result.summary).toHaveProperty('totalOrders');
      expect(result.summary).toHaveProperty('totalTax');
      expect(result).toHaveProperty('period');
    });
  });

  describe('getGstReport() — Phase 16', () => {
    it('should compute CGST and SGST correctly', async () => {
      mockPrisma.order.findMany.mockResolvedValue([
        {
          orderNumber: 'KH-ORD-001',
          createdAt: new Date(),
          subtotal: 1698,
          tax: 305.64,
          totalAmount: 2003.64,
          discount: 0,
        },
      ]);

      const result = await service.getGstReport('2026-08-01', '2026-08-31');

      expect(result).toHaveProperty('summary');
      expect(result.summary.cgst).toBe(result.summary.sgst); // CGST = SGST
      expect(result.summary.gstRate).toBe('18%');
    });
  });

  describe('getInventoryReport() — Phase 16', () => {
    it('should return inventory report with stock levels', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        {
          id: 'prod-1',
          name: 'Goat Milk Lotion',
          sku: 'KHL-001',
          price: 849,
          status: 'ACTIVE',
          category: { name: 'Lotions' },
          inventories: [{ transactions: [{ quantity: 50 }] }],
        },
      ]);

      const result = await service.getInventoryReport();

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toHaveProperty('netStock', 50);
      expect(result[0]).toHaveProperty('isLowStock');
    });
  });

  describe('logAction()', () => {
    it('should create an audit log entry', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      const result = await service.logAction({
        userId: 'admin-1',
        action: 'UPDATE',
        entity: 'Product',
        entityId: 'prod-1',
        newValues: { status: 'ACTIVE' },
      });

      expect(result).toHaveProperty('id', 'audit-1');
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });
});
