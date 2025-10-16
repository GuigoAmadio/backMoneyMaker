import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsArray,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum TransactionCategory {
  SALARY = 'SALARY',
  BONUS = 'BONUS',
  COMMISSION = 'COMMISSION',
  INVESTMENT = 'INVESTMENT',
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  FOOD = 'FOOD',
  TRANSPORT = 'TRANSPORT',
  HEALTH = 'HEALTH',
  ENTERTAINMENT = 'ENTERTAINMENT',
  EDUCATION = 'EDUCATION',
  SHOPPING = 'SHOPPING',
  OTHER = 'OTHER',
}

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Título da transação',
    example: 'Salário Janeiro',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({
    description: 'Descrição da transação',
    example: 'Salário mensal de janeiro',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Valor da transação',
    example: 5000.0,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @ApiProperty({
    description: 'Tipo da transação',
    enum: TransactionType,
    example: TransactionType.INCOME,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Categoria da transação',
    enum: TransactionCategory,
    example: TransactionCategory.SALARY,
  })
  @IsEnum(TransactionCategory)
  category: TransactionCategory;

  @ApiPropertyOptional({
    description: 'Status da transação',
    enum: TransactionStatus,
    example: TransactionStatus.CONFIRMED,
    default: TransactionStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiProperty({
    description: 'Data da transação',
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Se a transação é recorrente',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    description: 'Tags da transação',
    example: ['trabalho', 'salário'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Padrão de recorrência (JSON)',
    example: { frequency: 'MONTHLY', interval: 1, endDate: '2024-12-31' },
  })
  @IsOptional()
  recurringPattern?: any;
}
