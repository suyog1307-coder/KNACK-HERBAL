import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Priya' })
  @IsString() @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsString() @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: '+91-9876543210' })
  @IsString() @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://cdn.knackherbal.com/avatars/user-123.jpg' })
  @IsUrl() @IsOptional()
  avatarUrl?: string;
}
