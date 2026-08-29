import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateBannerDto {
  @ApiPropertyOptional({ example: 'Summer Sale — Up to 30% Off' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'https://cdn.knackherbal.com/banners/summer-sale.jpg' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({ example: '/shop?sale=1' })
  @IsString()
  @IsOptional()
  linkUrl?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
