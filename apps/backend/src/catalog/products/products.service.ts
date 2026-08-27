import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(publishedOnly = true) {
    return this.prisma.product.findMany({
      where: publishedOnly ? { status: ProductStatus.ACTIVE } : {},
      include: {
        category: true,
        images: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, images: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: dto,
      include: { category: true },
    });
  }

  // Alias kept for legacy internal use
  async getAllProducts() {
    return this.findAll(true);
  }

  async createProduct(data: CreateProductDto) {
    return this.create(data);
  }
}
