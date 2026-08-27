import { IsString, IsNotEmpty, IsPostalCode, IsBoolean, IsOptional } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsPostalCode('IN') // specifically for India
  @IsNotEmpty()
  pincode: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}