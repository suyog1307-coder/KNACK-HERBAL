import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'product-uuid-here' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Rating from 1 to 5', example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Amazing product!' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'My skin feels so much better after using this.' })
  @IsString()
  @IsOptional()
  comment?: string;
}
