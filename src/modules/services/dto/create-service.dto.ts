import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Nome do serviço',
    example: 'Consulta Básica',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição do serviço',
    example: 'Consulta de rotina com duração de 30 minutos',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Duração do serviço em minutos',
    example: 30,
    minimum: 15,
    maximum: 480,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(15, { message: 'Duração mínima é de 15 minutos' })
  @Max(480, { message: 'Duração máxima é de 480 minutos (8 horas)' })
  duration: number;

  @ApiProperty({
    description: 'Preço do serviço',
    example: 100.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Preço deve ser maior ou igual a zero' })
  price: number;

  @ApiPropertyOptional({
    description: 'Status ativo/inativo do serviço',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'ID da categoria do serviço',
    example: 'category-uuid',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
