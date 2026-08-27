import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateAddressDto } from './dto/create-address.dto'; // Ensure you created this from the previous step
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // ==========================================
  // CUSTOMER ROUTES (Protected by 'CUSTOMER' role)
  // ==========================================

  @Roles('CUSTOMER')
  @Post('addresses')
  addAddress(@Request() req, @Body() createAddressDto: CreateAddressDto) {
    // req.user.id is guaranteed to be the logged-in user
    return this.customersService.addAddress(req.user.id, createAddressDto);
  }

  @Roles('CUSTOMER')
  @Get('addresses')
  getAddresses(@Request() req) {
    return this.customersService.getAddresses(req.user.id);
  }

  // ==========================================
  // ADMIN ROUTES (Protected by 'ADMIN' role)
  // ==========================================

  @Roles('ADMIN')
  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    // Note: Removed the '+' from +id. If your Prisma DB uses Int IDs instead of String UUIDs, 
    // change this back to +id or Number(id).
    return this.customersService.findOne(id); 
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}