import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateInventoryDto {
  @ApiProperty({ example: 'prod-uuid-here' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ example: 'supplier-uuid-here' })
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({ example: 'BATCH-2026-08-001' })
  @IsString()
  @IsOptional()
  batchNumber?: string;
}
