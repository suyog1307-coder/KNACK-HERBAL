import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Role } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // CUSTOMER ADDRESS METHODS
  // ==========================================

  async addAddress(userId: string, dto: CreateAddressDto) {
    // If this is set as the default address, we might need to unset others first
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        ...dto,
        userId: userId,
      },
    });
  }

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundException('Address not found');

    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    return this.prisma.address.update({ where: { id: addressId }, data: dto });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundException('Address not found');
    await this.prisma.address.delete({ where: { id: addressId } });
    return { message: 'Address deleted' };
  }

  // ==========================================
  // ADMIN METHODS (Customer Management)
  // ==========================================

  async create(createCustomerDto: CreateCustomerDto) {
    // Assuming CreateCustomerDto includes email, password, etc.
    // In reality, admins might use a different flow to manually create users
    return this.prisma.user.create({
      data: {
        ...createCustomerDto,
        role: Role.CUSTOMER,
      },
    });
  }

  async findAll() {
    // Only return users who are customers
    return this.prisma.user.findMany({
      where: {
        role: Role.CUSTOMER,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        // Exclude passwordHash and sensitive fields
      },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.user.findFirst({
      where: { 
        id,
        role: Role.CUSTOMER,
      },
      include: {
        addresses: true, // Fetch their addresses too for the admin view
      }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const { passwordHash, ...safeCustomer } = customer;
    return safeCustomer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.prisma.user.update({
      where: { id },
      data: updateCustomerDto,
    });

    const { passwordHash, ...safeCustomer } = customer;
    return safeCustomer;
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}