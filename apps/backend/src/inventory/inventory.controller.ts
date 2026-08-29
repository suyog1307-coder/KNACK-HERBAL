import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { InventoryService } from './inventory.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { AddTransactionDto } from './dto/add-transaction.dto';
import { CreateStockAlertDto } from './dto/create-stock-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ─── Suppliers ────────────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Create a new supplier' })
  @Post('suppliers')
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.inventoryService.createSupplier(dto);
  }

  @ApiOperation({ summary: '[Admin] List all suppliers' })
  @Get('suppliers')
  getAllSuppliers() {
    return this.inventoryService.getAllSuppliers();
  }

  @ApiOperation({ summary: '[Admin] Get a supplier by ID' })
  @ApiParam({ name: 'id', description: 'Supplier UUID' })
  @Get('suppliers/:id')
  getSupplierById(@Param('id') id: string) {
    return this.inventoryService.getSupplierById(id);
  }

  @ApiOperation({ summary: '[Admin] Update a supplier' })
  @ApiParam({ name: 'id', description: 'Supplier UUID' })
  @Patch('suppliers/:id')
  updateSupplier(@Param('id') id: string, @Body() dto: Partial<CreateSupplierDto>) {
    return this.inventoryService.updateSupplier(id, dto);
  }

  @ApiOperation({ summary: '[Admin] Delete a supplier' })
  @ApiParam({ name: 'id', description: 'Supplier UUID' })
  @Delete('suppliers/:id')
  deleteSupplier(@Param('id') id: string) {
    return this.inventoryService.deleteSupplier(id);
  }

  // ─── Inventory Records ────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Create an inventory record for a product' })
  @Post()
  createInventory(@Body() dto: CreateInventoryDto) {
    return this.inventoryService.createInventory(dto);
  }

  @ApiOperation({ summary: '[Admin] Get all inventory records for a product' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @Get('product/:productId')
  getInventoryByProduct(@Param('productId') productId: string) {
    return this.inventoryService.getInventoryByProduct(productId);
  }

  @ApiOperation({ summary: '[Admin] Get net stock level for a product' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @Get('stock/:productId')
  getStockLevel(@Param('productId') productId: string) {
    return this.inventoryService.getStockLevel(productId);
  }

  // ─── Transactions ─────────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Record a stock transaction (purchase, sale, return, damage, adjustment)' })
  @ApiParam({ name: 'inventoryId', description: 'Inventory UUID' })
  @Post(':inventoryId/transactions')
  addTransaction(
    @Param('inventoryId') inventoryId: string,
    @Body() dto: AddTransactionDto,
  ) {
    return this.inventoryService.addTransaction(inventoryId, dto);
  }

  @ApiOperation({ summary: '[Admin] Get all transactions for an inventory record' })
  @ApiParam({ name: 'inventoryId', description: 'Inventory UUID' })
  @Get(':inventoryId/transactions')
  getTransactions(@Param('inventoryId') inventoryId: string) {
    return this.inventoryService.getTransactionsByInventory(inventoryId);
  }

  // ─── Stock Alerts ─────────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Create a low-stock alert for a product' })
  @Post('alerts')
  createStockAlert(@Body() dto: CreateStockAlertDto) {
    return this.inventoryService.createStockAlert(dto);
  }

  @ApiOperation({ summary: '[Admin] Get all active stock alerts (enriched with current stock)' })
  @Get('alerts')
  getActiveStockAlerts() {
    return this.inventoryService.getActiveStockAlerts();
  }

  @ApiOperation({ summary: '[Admin] Delete a stock alert' })
  @ApiParam({ name: 'id', description: 'StockAlert UUID' })
  @Delete('alerts/:id')
  deleteStockAlert(@Param('id') id: string) {
    return this.inventoryService.deleteStockAlert(id);
  }
}
