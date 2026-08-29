import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { SubscriptionInterval } from '@prisma/client';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'product-uuid-here' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ enum: SubscriptionInterval, example: SubscriptionInterval.MONTHLY })
  @IsEnum(SubscriptionInterval)
  interval: SubscriptionInterval;
}
