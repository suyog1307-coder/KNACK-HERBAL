import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AssignPartnerDto {
  @ApiProperty({ example: 'delivery-partner-uuid-here' })
  @IsString()
  @IsNotEmpty()
  partnerId: string;
}
