import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @ApiOperation({ summary: 'List all brands' })
  @Get()
  findAll() { return this.brandsService.findAll(); }

  @ApiOperation({ summary: 'Get a brand by ID' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findOne(@Param('id') id: string) { return this.brandsService.findOne(id); }

  @ApiOperation({ summary: '[Admin] Create a brand' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateBrandDto) { return this.brandsService.create(dto); }

  @ApiOperation({ summary: '[Admin] Update a brand' })
  @ApiParam({ name: 'id' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateBrandDto>) {
    return this.brandsService.update(id, dto);
  }

  @ApiOperation({ summary: '[Admin] Delete a brand' })
  @ApiParam({ name: 'id' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) { return this.brandsService.remove(id); }
}
