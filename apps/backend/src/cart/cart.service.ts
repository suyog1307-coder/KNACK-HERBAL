import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  /** Find or create a cart for the given user */
  private async getOrCreateCart(userId: string) {
    // The schema allows multiple carts per user (no unique constraint on userId).
    // We use findFirst to grab the existing one, or create a new one.
    let cart = await this.prisma.cart.findFirst({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }
    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    return this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const cart = await this.getOrCreateCart(userId);

    // Upsert: if item already in cart, update quantity; otherwise create
    return this.prisma.cartItem.upsert({
      where: {
        // CartItem has no compound unique index in this schema, so we find and update manually
        id: (
          await this.prisma.cartItem.findFirst({
            where: { cartId: cart.id, productId: dto.productId },
            select: { id: true },
          })
        )?.id ?? '',
      },
      update: { quantity: dto.quantity },
      create: {
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      },
    });
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
      include: { product: { include: { images: true } } },
    });
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { success: true, message: 'Cart cleared' };
  }
}
