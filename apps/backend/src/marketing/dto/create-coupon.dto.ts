import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsEnum, IsNumber, Min, IsOptional,
  IsBoolean, IsDateString, IsInt,
} from 'class-validator';
import { DiscountType } from '@prisma/client';

export class CreateCouponDto {
  @ApiProperty({ example: 'KNACK20' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ description: 'Discount value — percent (0-100) or flat amount in INR', example: 20 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderValue?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscount?: number;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsInt()
  @Min(1)
  @IsOptional()
  usageLimit?: number;
}
