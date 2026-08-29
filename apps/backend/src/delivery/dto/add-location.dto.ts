import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class AddLocationDto {
  @ApiProperty({ example: 16.7050 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 74.2433 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 270.5 })
  @IsNumber()
  @IsOptional()
  heading?: number;
}
