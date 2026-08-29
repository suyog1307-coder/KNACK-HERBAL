import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsNumber, Min, IsDateString,
  IsArray, IsUUID, IsOptional, IsInt,
} from 'class-validator';

export class CreateFlashSaleDto {
  @ApiProperty({ example: 'Diwali Flash Sale' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Discount percentage (0-100)', example: 30 })
  @IsNumber() @Min(0)
  discountPercent: number;

  @ApiProperty({ example: '2026-10-01T10:00:00.000Z' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ example: '2026-10-01T22:00:00.000Z' })
  @IsDateString()
  endsAt: string;

  @ApiProperty({ description: 'Product UUIDs included in the sale', type: [String] })
  @IsArray() @IsUUID('4', { each: true })
  productIds: string[];
}
