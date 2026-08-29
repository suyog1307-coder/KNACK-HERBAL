import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { CreateProductSeoDto } from './dto/create-product-seo.dto';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── List / Search ────────────────────────────────────────────────────────

  async findAll(publishedOnly = true) {
    return this.prisma.product.findMany({
      where: publishedOnly ? { status: ProductStatus.ACTIVE } : {},
      include: { category: true, images: true, brand: true },
      orderBy: { name: 'asc' },
    });
  }

  async search(query: QueryProductsDto) {
    const {
      q, categoryId, brandId, minPrice, maxPrice,
      status, page = 1, pageSize = 20,
    } = query;

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (status) where.status = status;
    else where.status = ProductStatus.ACTIVE;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const skip = (page - 1) * pageSize;
    const [total, items] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: { category: true, images: true, brand: true },
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // ─── Single product ───────────────────────────────────────────────────────

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true, images: true, variants: true,
        seo: true, brand: true,
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true, images: true, variants: true,
        seo: true, brand: true,
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: dto,
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id }, data: dto,
      include: { category: true, images: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ARCHIVED },
    });
  }

  // ─── Variants ─────────────────────────────────────────────────────────────

  async addVariant(productId: string, dto: CreateVariantDto) {
    await this.findOne(productId);
    return this.prisma.productVariant.create({ data: { productId, ...dto } });
  }

  async updateVariant(variantId: string, dto: Partial<CreateVariantDto>) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    return this.prisma.productVariant.update({ where: { id: variantId }, data: dto });
  }

  async deleteVariant(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    await this.prisma.productVariant.delete({ where: { id: variantId } });
    return { message: 'Variant deleted' };
  }

  // ─── SEO ──────────────────────────────────────────────────────────────────

  async upsertSeo(productId: string, dto: CreateProductSeoDto) {
    await this.findOne(productId);
    return this.prisma.productSEO.upsert({
      where: { productId },
      create: { productId, ...dto },
      update: dto,
    });
  }

  // ─── Images ───────────────────────────────────────────────────────────────

  async addImage(productId: string, url: string, altText?: string, isPrimary = false) {
    await this.findOne(productId);
    if (isPrimary) {
      await this.prisma.productImage.updateMany({
        where: { productId }, data: { isPrimary: false },
      });
    }
    return this.prisma.productImage.create({
      data: { productId, url, altText, isPrimary },
    });
  }

  async deleteImage(imageId: string) {
    const image = await this.prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) throw new NotFoundException('Image not found');
    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { message: 'Image deleted' };
  }

  // Legacy aliases
  async getAllProducts() { return this.findAll(true); }
  async createProduct(data: CreateProductDto) { return this.create(data); }
}
