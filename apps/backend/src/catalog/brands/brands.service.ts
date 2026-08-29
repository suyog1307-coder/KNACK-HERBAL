import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBrandDto) {
    const existing = await this.prisma.brand.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Brand name already exists');
    return this.prisma.brand.create({ data: dto });
  }

  async findAll() {
    return this.prisma.brand.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: { products: { where: { status: 'ACTIVE' }, include: { images: true } } },
    });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async update(id: string, dto: Partial<CreateBrandDto>) {
    await this.findOne(id);
    return this.prisma.brand.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.brand.delete({ where: { id } });
    return { message: 'Brand deleted' };
  }
}
