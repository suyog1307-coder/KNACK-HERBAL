import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateBlogDto {
  @ApiProperty({ example: '5 Herbal Ingredients for Glowing Skin' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '5-herbal-ingredients-for-glowing-skin' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'Discover the power of nature for radiant skin.' })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiProperty({ example: 'Full blog content goes here...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'Dr. Priya Sharma' })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiPropertyOptional({ example: 'https://cdn.knackherbal.com/blog/hero.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
