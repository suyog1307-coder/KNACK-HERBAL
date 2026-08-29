import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from '../../dto/create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
