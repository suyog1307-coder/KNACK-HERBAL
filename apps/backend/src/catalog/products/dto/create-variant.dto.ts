import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsInt, Min } from 'class-validator';

export class CreateVariantDto {
  @ApiProperty({ example: '500ml' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'KH-FC-001-500ML' })
  @IsString() @IsNotEmpty()
  sku: string;

  @ApiPropertyOptional({ example: 799 })
  @IsNumber() @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsInt() @Min(0) @IsOptional()
  stock?: number;
}
