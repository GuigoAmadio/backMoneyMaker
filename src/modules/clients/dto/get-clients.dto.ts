import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetClientsDto {
  @ApiPropertyOptional({
    description: 'Página atual',
    example: '1',
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Itens por página',
    example: '10',
  })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Termo de busca',
    example: 'João',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'all'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}
