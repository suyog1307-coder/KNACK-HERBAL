import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string; // Auto-generated from name if not provided

  @IsString()
  @IsOptional()
  description?: string;
}
