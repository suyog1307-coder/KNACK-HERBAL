import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth,
} from '@nestjs/swagger';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { CreateProductSeoDto } from './dto/create-product-seo.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ─── Public ───────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Search & filter products' })
  @Get('search')
  search(@Query() query: QueryProductsDto) {
    return this.productsService.search(query);
  }

  @ApiOperation({ summary: 'List all active products' })
  @Get()
  findAll() { return this.productsService.findAll(true); }

  @ApiOperation({ summary: 'Get a product by slug' })
  @ApiParam({ name: 'slug' })
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findOne(@Param('id') id: string) { return this.productsService.findOne(id); }

  // ─── Admin: Product CRUD ──────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Create a product' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateProductDto) { return this.productsService.create(dto); }

  @ApiOperation({ summary: '[Admin] Update a product' })
  @ApiParam({ name: 'id' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @ApiOperation({ summary: '[Admin] Archive a product (soft delete)' })
  @ApiParam({ name: 'id' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) { return this.productsService.remove(id); }

  // ─── Admin: Variants ──────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Add a variant to a product' })
  @ApiParam({ name: 'id' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/variants')
  addVariant(@Param('id') id: string, @Body() dto: CreateVariantDto) {
    return this.productsService.addVariant(id, dto);
  }

  @ApiOperation({ summary: '[Admin] Update a variant' })
  @ApiParam({ name: 'variantId' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('variants/:variantId')
  updateVariant(@Param('variantId') variantId: string, @Body() dto: Partial<CreateVariantDto>) {
    return this.productsService.updateVariant(variantId, dto);
  }

  @ApiOperation({ summary: '[Admin] Delete a variant' })
  @ApiParam({ name: 'variantId' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('variants/:variantId')
  deleteVariant(@Param('variantId') variantId: string) {
    return this.productsService.deleteVariant(variantId);
  }

  // ─── Admin: SEO ───────────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Set SEO metadata for a product' })
  @ApiParam({ name: 'id' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/seo')
  upsertSeo(@Param('id') id: string, @Body() dto: CreateProductSeoDto) {
    return this.productsService.upsertSeo(id, dto);
  }

  // ─── Admin: Images ────────────────────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Delete a product image' })
  @ApiParam({ name: 'imageId' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('images/:imageId')
  deleteImage(@Param('imageId') imageId: string) {
    return this.productsService.deleteImage(imageId);
  }
}
