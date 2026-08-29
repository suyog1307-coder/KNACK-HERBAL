import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateProductSeoDto {
  @ApiPropertyOptional({ example: 'Aloe Vera Gel Moisturiser | Knack Herbal' })
  @IsString() @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Shop our award-winning aloe vera gel moisturiser.' })
  @IsString() @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'aloe vera, moisturiser, face care, herbal' })
  @IsString() @IsOptional()
  keywords?: string;
}
