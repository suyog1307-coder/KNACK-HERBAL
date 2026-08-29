import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterReferralDto {
  @ApiProperty({
    description: 'Referral code provided by the referrer at sign-up',
    example: 'REF-abc123',
  })
  @IsString()
  @IsNotEmpty()
  referralCode: string;
}
