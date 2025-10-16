import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateBudgetCategoryDto {
  @ApiProperty({
    description: 'ID da categoria',
    example: 'cat_123',
  })
  @IsString()
  categoryId: string;

  @ApiProperty({
    description: 'Valor alocado para esta categoria no orçamento',
    example: 2000.00,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @ApiPropertyOptional({
    description: 'Valor já gasto nesta categoria',
    example: 500.00,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  spent?: number = 0;
}
