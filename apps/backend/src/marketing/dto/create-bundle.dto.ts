import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsNumber, Min, IsOptional,
  IsArray, ValidateNested, IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

class BundleItemDto {
  @ApiProperty({ example: 'product-uuid-here' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateBundleDto {
  @ApiProperty({ example: 'Herbal Glow Kit' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'herbal-glow-kit' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'Complete herbal skincare bundle' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1999 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ type: [BundleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundleItemDto)
  items: BundleItemDto[];
}
