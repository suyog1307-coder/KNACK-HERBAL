import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DeliveryStatus } from '@prisma/client';

export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: DeliveryStatus, example: DeliveryStatus.IN_TRANSIT })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @ApiPropertyOptional({ example: 'Kolhapur Hub' })
  @IsString()
  @IsOptional()
  location?: string;
}
