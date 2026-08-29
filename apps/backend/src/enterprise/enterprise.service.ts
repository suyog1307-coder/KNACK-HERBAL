import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnterpriseService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Audit Logs ───────────────────────────────────────────────────────────

  async getAuditLogs(limit = 100) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, role: true } },
      },
    });
  }

  async getAuditLogsByEntity(entity: string) {
    return this.prisma.auditLog.findMany({
      where: { entity },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async getAuditLogsByUser(userId: string) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Write an audit log entry. Called internally by other services/interceptors.
   */
  async logAction(data: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValues?: object;
    newValues?: object;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        ...data,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : undefined,
        newValues: data.newValues ? JSON.stringify(data.newValues) : undefined,
      },
    });
  }

  // ─── Activity Tracking ────────────────────────────────────────────────────

  async trackActivity(data: {
    userId?: string;
    sessionId?: string;
    eventType: string;
    url?: string;
    metadata?: object;
  }) {
    return this.prisma.activity.create({
      data: {
        ...data,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
    });
  }

  async getRecentActivity(limit = 200) {
    return this.prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ─── Business Metrics ─────────────────────────────────────────────────────

  /**
   * Upsert today's business metric snapshot.
   * Call this via a scheduled job or after each order confirmation.
   */
  async upsertDailyMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalOrders, salesAgg, newUsers] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow } },
        _sum: { totalAmount: true },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    ]);

    return this.prisma.businessMetric.upsert({
      where: { date: today },
      create: {
        date: today,
        totalOrders,
        totalSales: salesAgg._sum.totalAmount ?? 0,
        newUsers,
      },
      update: {
        totalOrders,
        totalSales: salesAgg._sum.totalAmount ?? 0,
        newUsers,
      },
    });
  }

  async getMetricsRange(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    return this.prisma.businessMetric.findMany({
      where: { date: { gte: since } },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Dashboard summary — live counts, no caching.
   */
  async getDashboardSummary() {
    const [
      totalUsers,
      totalOrders,
      totalRevenue,
      pendingOrders,
      openTickets,
      lowStockProducts,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { totalAmount: true } }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.ticket.count({ where: { status: 'OPEN' } }),
      this.prisma.product.count({
        where: {
          inventories: {
            some: {
              transactions: { none: {} },
            },
          },
        },
      }),
    ]);

    return {
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount ?? 0,
      pendingOrders,
      openTickets,
      lowStockProducts,
    };
  }

  // ─── Reports ──────────────────────────────────────────────────────────────

  async getSalesReport(fromDate: string, toDate: string) {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const [orders, byStatus, topProducts] = await Promise.all([
      this.prisma.order.aggregate({
        where: { createdAt: { gte: from, lte: to } },
        _sum: { totalAmount: true, tax: true, discount: true, deliveryFee: true },
        _count: { id: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: from, lte: to } },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { createdAt: { gte: from, lte: to } } },
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
    ]);

    const topProductDetails = await Promise.all(
      topProducts.map(async (tp) => {
        const product = await this.prisma.product.findUnique({
          where: { id: tp.productId },
          select: { name: true, sku: true, price: true },
        });
        return { ...product, totalSold: tp._sum.quantity, orderCount: tp._count.id };
      }),
    );

    return {
      period: { from: fromDate, to: toDate },
      summary: {
        totalOrders: orders._count.id,
        totalRevenue: orders._sum.totalAmount ?? 0,
        totalTax: orders._sum.tax ?? 0,
        totalDiscount: orders._sum.discount ?? 0,
        totalDeliveryFee: orders._sum.deliveryFee ?? 0,
      },
      byStatus,
      topProducts: topProductDetails,
    };
  }

  async getRevenueReport(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const daily = await this.prisma.order.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: since } },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    return { days, data: daily };
  }

  async getInventoryReport() {
    const products = await this.prisma.product.findMany({
      include: {
        inventories: { include: { transactions: true } },
        category: { select: { name: true } },
      },
    });

    return products.map((p) => {
      const netStock = p.inventories.reduce((total, inv) => {
        return total + inv.transactions.reduce((s, tx) => s + tx.quantity, 0);
      }, 0);
      return {
        id: p.id, name: p.name, sku: p.sku,
        category: p.category.name, price: p.price,
        netStock, status: p.status,
        isLowStock: netStock <= 10,
      };
    });
  }

  async getCustomerReport() {
    const [total, newThisMonth, topSpenders] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: new Date(new Date().setDate(1)) },
        },
      }),
      this.prisma.order.groupBy({
        by: ['userId'],
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),
    ]);

    const topSpenderDetails = await Promise.all(
      topSpenders.map(async (ts) => {
        const user = await this.prisma.user.findUnique({
          where: { id: ts.userId },
          select: { firstName: true, lastName: true, email: true },
        });
        return { ...user, totalSpent: ts._sum.totalAmount, orderCount: ts._count.id };
      }),
    );

    return { total, newThisMonth, topSpenders: topSpenderDetails };
  }

  async getGstReport(fromDate: string, toDate: string) {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
      select: {
        orderNumber: true, createdAt: true,
        subtotal: true, tax: true,
        totalAmount: true, discount: true,
      },
    });

    const totalTaxCollected = orders.reduce((sum, o) => sum + o.tax, 0);
    const cgst = parseFloat((totalTaxCollected / 2).toFixed(2));
    const sgst = parseFloat((totalTaxCollected / 2).toFixed(2));

    return {
      period: { from: fromDate, to: toDate },
      summary: { totalTaxCollected, cgst, sgst, gstRate: '18%' },
      orders,
    };
  }
}
