import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional, IsString, IsNumber, IsEnum,
  IsUUID, Min, Max, IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@prisma/client';

export class QueryProductsDto {
  @ApiPropertyOptional({ example: 'aloe vera' })
  @IsString() @IsOptional()
  q?: string;

  @ApiPropertyOptional({ example: 'face-care-uuid' })
  @IsUUID() @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'brand-uuid' })
  @IsUUID() @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ example: 200 })
  @Type(() => Number)
  @IsNumber() @Min(0) @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ example: 2000 })
  @Type(() => Number)
  @IsNumber() @Min(0) @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsEnum(ProductStatus) @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt() @Min(1) @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @Type(() => Number)
  @IsInt() @Min(1) @Max(100) @IsOptional()
  pageSize?: number = 20;
}
