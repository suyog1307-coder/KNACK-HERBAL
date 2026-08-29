import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

export class CreateStockAlertDto {
  @ApiProperty({ example: 'prod-uuid-here' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: 'Alert when stock falls below this number', example: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  threshold?: number;
}
