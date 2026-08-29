import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateTestimonialDto {
  @ApiProperty({ example: 'Priya Sharma' })
  @IsString() @IsNotEmpty()
  customerName: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsString() @IsOptional()
  location?: string;

  @ApiProperty({ example: 'This lotion transformed my skin in just 2 weeks!' })
  @IsString() @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Rating 1-5', example: 5 })
  @IsInt() @Min(1) @Max(5) @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ example: 'https://cdn.knackherbal.com/avatars/priya.jpg' })
  @IsString() @IsOptional()
  avatarUrl?: string;
}
