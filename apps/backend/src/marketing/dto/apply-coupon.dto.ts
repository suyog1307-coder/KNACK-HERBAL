import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ApplyCouponDto {
  @ApiProperty({ example: 'KNACK20' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'order-uuid-here' })
  @IsString()
  @IsNotEmpty()
  orderId: string;
}
