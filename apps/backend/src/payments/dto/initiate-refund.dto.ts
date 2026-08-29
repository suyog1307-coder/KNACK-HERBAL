import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class InitiateRefundDto {
  @ApiProperty({ example: 'payment-uuid-here' })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({ description: 'Amount to refund in INR', example: 849 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 'Customer requested cancellation' })
  @IsString()
  @IsOptional()
  reason?: string;
}
