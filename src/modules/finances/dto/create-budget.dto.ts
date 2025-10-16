import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum BudgetPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

export enum BudgetStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateBudgetDto {
  @ApiProperty({
    description: 'Nome do orçamento',
    example: 'Orçamento Familiar 2024',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição do orçamento',
    example: 'Orçamento familiar para o ano de 2024',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Período do orçamento',
    enum: BudgetPeriod,
    example: BudgetPeriod.MONTHLY,
  })
  @IsEnum(BudgetPeriod)
  period: BudgetPeriod;

  @ApiProperty({
    description: 'Data de início do orçamento',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Data de fim do orçamento',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Valor total do orçamento',
    example: 50000.0,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Transform(({ value }) => parseFloat(value))
  totalAmount: number;

  @ApiPropertyOptional({
    description: 'Status do orçamento',
    enum: BudgetStatus,
    example: BudgetStatus.ACTIVE,
    default: BudgetStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus = BudgetStatus.ACTIVE;
}
