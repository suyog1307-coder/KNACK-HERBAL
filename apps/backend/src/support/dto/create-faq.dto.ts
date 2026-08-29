import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({ example: 'How long does delivery take?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'We deliver within 5-7 business days across India.' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({ example: 'Shipping' })
  @IsString()
  @IsOptional()
  category?: string;
}
