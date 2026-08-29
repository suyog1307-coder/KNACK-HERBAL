import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { AddTransactionDto } from './dto/add-transaction.dto';
import { CreateStockAlertDto } from './dto/create-stock-alert.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Suppliers ────────────────────────────────────────────────────────────

  async createSupplier(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async getAllSuppliers() {
    return this.prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  }

  async getSupplierById(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: { inventories: { include: { product: true } } },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async updateSupplier(id: string, dto: Partial<CreateSupplierDto>) {
    await this.getSupplierById(id); // throws if not found
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async deleteSupplier(id: string) {
    await this.getSupplierById(id);
    await this.prisma.supplier.delete({ where: { id } });
    return { message: 'Supplier deleted successfully' };
  }

  // ─── Inventory Records ────────────────────────────────────────────────────

  async createInventory(dto: CreateInventoryDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
      if (!supplier) throw new NotFoundException('Supplier not found');
    }

    return this.prisma.inventory.create({
      data: dto,
      include: { product: true, supplier: true },
    });
  }

  async getInventoryByProduct(productId: string) {
    return this.prisma.inventory.findMany({
      where: { productId },
      include: {
        supplier: true,
        transactions: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  /**
   * Get net stock level for a product by summing all InventoryTransaction quantities.
   * Positive transactions = PURCHASE/RETURN, negative = SALE/DAMAGE.
   */
  async getStockLevel(productId: string) {
    const result = await this.prisma.inventoryTransaction.aggregate({
      where: { inventory: { productId } },
      _sum: { quantity: true },
    });

    return {
      productId,
      netStock: result._sum.quantity ?? 0,
    };
  }

  // ─── Transactions ─────────────────────────────────────────────────────────

  async addTransaction(inventoryId: string, dto: AddTransactionDto) {
    const inventory = await this.prisma.inventory.findUnique({ where: { id: inventoryId } });
    if (!inventory) throw new NotFoundException('Inventory record not found');

    // Prevent stock going negative
    if (dto.quantity < 0) {
      const current = await this.prisma.inventoryTransaction.aggregate({
        where: { inventoryId },
        _sum: { quantity: true },
      });
      const currentStock = current._sum.quantity ?? 0;
      if (currentStock + dto.quantity < 0) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${currentStock}, requested deduction: ${Math.abs(dto.quantity)}`,
        );
      }
    }

    return this.prisma.inventoryTransaction.create({
      data: { inventoryId, ...dto },
    });
  }

  async getTransactionsByInventory(inventoryId: string) {
    const inventory = await this.prisma.inventory.findUnique({ where: { id: inventoryId } });
    if (!inventory) throw new NotFoundException('Inventory record not found');

    return this.prisma.inventoryTransaction.findMany({
      where: { inventoryId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Stock Alerts ─────────────────────────────────────────────────────────

  async createStockAlert(dto: CreateStockAlertDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.stockAlert.create({ data: dto });
  }

  async getActiveStockAlerts() {
    const alerts = await this.prisma.stockAlert.findMany({
      where: { isActive: true },
      include: { product: true },
    });

    // Enrich each alert with current stock level
    const enriched = await Promise.all(
      alerts.map(async (alert) => {
        const { netStock } = await this.getStockLevel(alert.productId);
        return {
          ...alert,
          currentStock: netStock,
          isBelowThreshold: netStock <= alert.threshold,
        };
      }),
    );

    return enriched;
  }

  async deleteStockAlert(id: string) {
    const alert = await this.prisma.stockAlert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Stock alert not found');
    await this.prisma.stockAlert.delete({ where: { id } });
    return { message: 'Stock alert removed' };
  }
}
