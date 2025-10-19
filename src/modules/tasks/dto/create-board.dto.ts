import { IsString, IsOptional, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBoardColumnDto {
  @ApiProperty({ description: 'Nome da coluna' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Cor da coluna (hex)' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Limite WIP da coluna' })
  @IsOptional()
  wipLimit?: number;
}

export class CreateBoardDto {
  @ApiProperty({ description: 'Nome do board' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do board' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Cor do board (hex)' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Ícone do board (emoji ou nome)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: 'ID do workspace' })
  @IsUUID()
  workspaceId: string;

  @ApiPropertyOptional({ description: 'Colunas iniciais do board', type: [CreateBoardColumnDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBoardColumnDto)
  columns?: CreateBoardColumnDto[];
}

