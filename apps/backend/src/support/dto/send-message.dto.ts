import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'Hello, I need help with my order.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
