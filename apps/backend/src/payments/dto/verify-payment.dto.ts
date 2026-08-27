import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({
    description: 'HMAC-SHA256 signature provided by Razorpay after payment',
    example: 'abc123def456...',
  })
  @IsString()
  @IsNotEmpty()
  razorpay_signature: string;

  @ApiProperty({
    description: 'Razorpay payment ID returned on successful capture',
    example: 'pay_ABC123XYZ',
  })
  @IsString()
  @IsNotEmpty()
  razorpay_payment_id: string;

  @ApiProperty({
    description: 'Razorpay order ID created during the initiation step',
    example: 'order_ABC123XYZ',
  })
  @IsString()
  @IsNotEmpty()
  razorpay_order_id: string;
}
