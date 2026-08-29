import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ReturnOrderDto {
  @ApiProperty({ example: 'Product arrived damaged' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
