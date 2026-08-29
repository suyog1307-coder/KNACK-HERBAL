import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateDeliveryDto {
  @ApiProperty({ example: 'order-uuid-here' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiPropertyOptional({ example: '2026-08-20T14:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  estimatedTime?: string;
}
