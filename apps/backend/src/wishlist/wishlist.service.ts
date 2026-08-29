import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Wishlist is stored via the Activity table as PAGE_VIEW events with eventType = 'WISHLIST_ADD'.
 * This keeps schema changes minimal while delivering full wishlist functionality.
 * The productIds are stored as JSON in the metadata field.
 *
 * Alternative: A proper Wishlist model can be added to the schema later.
 * For now we use a dedicated JSON store per user via Activity.
 */
@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  private async getWishlistRecord(userId: string) {
    return this.prisma.activity.findFirst({
      where: { userId, eventType: 'WISHLIST' },
    });
  }

  private parseProductIds(record: any): string[] {
    if (!record?.metadata) return [];
    try { return JSON.parse(record.metadata).productIds ?? []; } catch { return []; }
  }

  async getWishlist(userId: string) {
    const record = await this.getWishlistRecord(userId);
    const productIds = this.parseProductIds(record);

    if (!productIds.length) return { items: [] };

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, status: 'ACTIVE' },
      include: { images: true, category: true },
    });

    return { items: products };
  }

  async addToWishlist(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const record = await this.getWishlistRecord(userId);
    const ids = this.parseProductIds(record);

    if (!ids.includes(productId)) {
      const updated = [...ids, productId];
      if (record) {
        await this.prisma.activity.update({
          where: { id: record.id },
          data: { metadata: JSON.stringify({ productIds: updated }) },
        });
      } else {
        await this.prisma.activity.create({
          data: { userId, eventType: 'WISHLIST', metadata: JSON.stringify({ productIds: updated }) },
        });
      }
    }

    return { message: 'Added to wishlist' };
  }

  async removeFromWishlist(userId: string, productId: string) {
    const record = await this.getWishlistRecord(userId);
    if (!record) return { message: 'Wishlist is empty' };

    const ids = this.parseProductIds(record).filter((id) => id !== productId);
    await this.prisma.activity.update({
      where: { id: record.id },
      data: { metadata: JSON.stringify({ productIds: ids }) },
    });

    return { message: 'Removed from wishlist' };
  }

  async clearWishlist(userId: string) {
    const record = await this.getWishlistRecord(userId);
    if (record) {
      await this.prisma.activity.update({
        where: { id: record.id },
        data: { metadata: JSON.stringify({ productIds: [] }) },
      });
    }
    return { message: 'Wishlist cleared' };
  }
}
