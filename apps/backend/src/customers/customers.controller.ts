import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, UseGuards, Request,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiParam, ApiTags,
} from '@nestjs/swagger';

import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // ─── Customer: Address management ─────────────────────────────────────────

  @ApiOperation({ summary: 'Add a new delivery address' })
  @Roles('CUSTOMER')
  @Post('addresses')
  addAddress(@Request() req, @Body() dto: CreateAddressDto) {
    return this.customersService.addAddress(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Get all my addresses' })
  @Roles('CUSTOMER')
  @Get('addresses')
  getAddresses(@Request() req) {
    return this.customersService.getAddresses(req.user.id);
  }

  @ApiOperation({ summary: 'Update an address' })
  @ApiParam({ name: 'id', description: 'Address UUID' })
  @Roles('CUSTOMER')
  @Patch('addresses/:id')
  updateAddress(@Request() req, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.customersService.updateAddress(req.user.id, id, dto);
  }

  @ApiOperation({ summary: 'Delete an address' })
  @ApiParam({ name: 'id', description: 'Address UUID' })
  @Roles('CUSTOMER')
  @Delete('addresses/:id')
  deleteAddress(@Request() req, @Param('id') id: string) {
    return this.customersService.deleteAddress(req.user.id, id);
  }

  // ─── Admin: Customer management ───────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Create a customer' })
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @ApiOperation({ summary: '[Admin] List all customers' })
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @ApiOperation({ summary: '[Admin] Get a customer by ID' })
  @ApiParam({ name: 'id' })
  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @ApiOperation({ summary: '[Admin] Update a customer' })
  @ApiParam({ name: 'id' })
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @ApiOperation({ summary: '[Admin] Delete a customer' })
  @ApiParam({ name: 'id' })
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
