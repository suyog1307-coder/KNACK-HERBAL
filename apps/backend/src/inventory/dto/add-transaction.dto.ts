import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class AddTransactionDto {
  @ApiProperty({ enum: TransactionType, example: TransactionType.PURCHASE })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ description: 'Positive for PURCHASE/RETURN, negative for SALE/DAMAGE', example: 100 })
  @IsInt()
  quantity: number;

  @ApiPropertyOptional({ example: 'Monthly stock replenishment' })
  @IsString()
  @IsOptional()
  reason?: string;
}
