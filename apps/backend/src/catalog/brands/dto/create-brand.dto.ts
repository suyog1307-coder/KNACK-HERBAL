import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ example: 'Knack Naturals' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Premium herbal beauty brand' })
  @IsString() @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.knackherbal.com/brands/logo.png' })
  @IsUrl() @IsOptional()
  logoUrl?: string;
}
