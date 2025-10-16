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

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export class CreateFinancialGoalDto {
  @ApiProperty({
    description: 'Título da meta financeira',
    example: 'Viagem para Europa',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({
    description: 'Descrição da meta',
    example: 'Economizar para viagem de 15 dias pela Europa',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Valor alvo da meta',
    example: 15000.0,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Transform(({ value }) => parseFloat(value))
  targetAmount: number;

  @ApiPropertyOptional({
    description: 'Valor atual já economizado',
    example: 5000.0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  currentAmount?: number = 0;

  @ApiProperty({
    description: 'Data alvo para atingir a meta',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  targetDate: string;

  @ApiPropertyOptional({
    description: 'Status da meta',
    enum: GoalStatus,
    example: GoalStatus.ACTIVE,
    default: GoalStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus = GoalStatus.ACTIVE;
}
