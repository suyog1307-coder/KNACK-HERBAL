import { PartialType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
    @ApiProperty({ example: '1995-08-15', required: false })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiProperty({ example: 'Male', required: false })
  @IsOptional()
  @IsString()
  gender?: string;
}
