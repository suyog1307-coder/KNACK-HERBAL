import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PricingUtil } from '../common/utils/gst.util';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Generate a human-readable order number, e.g. KH-ORD-20260814-0001.
   * Uses the current date + a zero-padded daily sequence count.
   */
  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, ''); // "20260814"

    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const count = await this.prisma.order.count({
      where: { createdAt: { gte: startOfDay } },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `KH-ORD-${datePart}-${sequence}`;
  }

  // ─── Customer endpoints ───────────────────────────────────────────────────

  /**
   * Convert the authenticated user's active cart into a PENDING order.
   *
   * Flow:
   *  1. Fetch cart with items + products
   *  2. Validate stock availability via InventoryTransaction net quantities
   *  3. Calculate pricing using PricingUtil (subtotal / tax / deliveryFee / totalAmount)
   *  4. In a single transaction:
   *     a. Create Order + OrderItems
   *     b. Record a SALE InventoryTransaction for each item (reservation pattern)
   *     c. Record an initial OrderStatusHistory entry
   *     d. Clear the cart
   */
  async createOrderFromCart(userId: string, addressId: string) {
    // 1. Verify the delivery address belongs to this user
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new NotFoundException('Delivery address not found');
    }

    // 2. Fetch cart
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { inventories: { include: { transactions: true } } },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty');
    }

    // 3. Validate stock via net InventoryTransaction quantities
    for (const item of cart.items) {
      const netStock = item.product.inventories.reduce((total, inv) => {
        const txNet = inv.transactions.reduce((s, tx) => s + tx.quantity, 0);
        return total + txNet;
      }, 0);

      if (netStock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${item.product.name}". Available: ${netStock}`,
        );
      }
    }

    // 4. Calculate pricing
    const pricingItems = cart.items.map((i) => ({
      price: i.product.price,
      quantity: i.quantity,
    }));
    const totals = PricingUtil.calculateCartTotals(pricingItems);

    // 5. Generate order number
    const orderNumber = await this.generateOrderNumber();

    // 6. Persist everything in a single transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // a. Create the Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          shippingAddressId: addressId,
          billingAddressId: addressId,
          subtotal: totals.subtotal,
          tax: totals.tax,
          deliveryFee: totals.deliveryFee,
          totalAmount: totals.totalAmount,
          status: OrderStatus.PENDING,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: true,
          shippingAddress: true,
        },
      });

      // b. Record a SALE InventoryTransaction for stock reservation
      for (const item of cart.items) {
        // Find the first available inventory record for this product
        const inventory = item.product.inventories[0];
        if (inventory) {
          await tx.inventoryTransaction.create({
            data: {
              inventoryId: inventory.id,
              type: 'SALE',
              quantity: -item.quantity, // Negative = outgoing
              reason: `Reserved for order ${orderNumber}`,
            },
          });
        }
      }

      // c. Record initial status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: OrderStatus.PENDING,
          notes: 'Order created, awaiting payment',
        },
      });

      // d. Clear the cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });

    // Fire order confirmation email (outside transaction — non-critical)
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user?.email) {
      // result is the returned order from the transaction above
      void this.notifications.sendOrderConfirmation(user.email, result.orderNumber, result.totalAmount);
    }

    return result;
  }

  /** Return all orders for the authenticated customer, newest first */
  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { include: { images: { where: { isPrimary: true } } } },
          },
        },
        shippingAddress: true,
        payments: { select: { status: true, method: true } },
      },
    });
  }

  /** Return a single order owned by the user */
  async getOrderById(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: { include: { product: true } },
        shippingAddress: true,
        billingAddress: true,
        payments: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  // ─── Admin endpoints ──────────────────────────────────────────────────────

  /** List all orders (admin) */
  async getAllOrders() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: true,
        payments: { select: { status: true } },
      },
    });
  }

  /**
   * Customer requests a return on a DELIVERED order.
   * Restores inventory and transitions order to RETURN_REQUESTED.
   */
  async requestReturn(orderId: string, userId: string, reason: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: { include: { product: { include: { inventories: true } } } } },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        `Only delivered orders can be returned. Current status: ${order.status}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.RETURN_REQUESTED },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.RETURN_REQUESTED,
          notes: `Return requested by customer. Reason: ${reason}`,
        },
      });

      // Restore stock for returned items
      for (const item of order.items) {
        const inventory = item.product.inventories[0];
        if (inventory) {
          await tx.inventoryTransaction.create({
            data: {
              inventoryId: inventory.id,
              type: 'RETURN',
              quantity: item.quantity,
              reason: `Return requested for order ${order.orderNumber}`,
            },
          });
        }
      }

      return updated;
    });
  }

  /** Update the status of any order and append to its history (admin) */
  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status },
      });

      await tx.orderStatusHistory.create({
        data: { orderId, status, notes: notes ?? null },
      });

      return updated;
    });

    // Notify customer of status change for key milestones
    const notifyStatuses: OrderStatus[] = [
      OrderStatus.CONFIRMED, OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED,
    ];
    if (notifyStatuses.includes(status)) {
      const user = await this.prisma.user.findUnique({
        where: { id: order.userId }, select: { email: true },
      });
      if (user?.email) {
        void this.notifications.sendShippingUpdate(user.email, order.orderNumber, status);
      }
    }

    return result;
  }

  /**
   * Customer cancels a PENDING or CONFIRMED order.
   * Restores inventory by creating a RETURN transaction for each item.
   */
  async cancelOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: { include: { product: { include: { inventories: true } } } } },
    });

    if (!order) throw new NotFoundException('Order not found');

    const cancellable: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
    if (!cancellable.includes(order.status)) {
      throw new BadRequestException(
        `Order in "${order.status}" status cannot be cancelled`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      await tx.orderStatusHistory.create({
        data: { orderId, status: OrderStatus.CANCELLED, notes: 'Cancelled by customer' },
      });

      // Restore stock: RETURN transaction for each order item
      for (const item of order.items) {
        const inventory = item.product.inventories[0];
        if (inventory) {
          await tx.inventoryTransaction.create({
            data: {
              inventoryId: inventory.id,
              type: 'RETURN',
              quantity: item.quantity, // Positive = back in stock
              reason: `Order ${order.orderNumber} cancelled`,
            },
          });
        }
      }

      return updated;
    });
  }
}
