import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSprintDto {
  @ApiProperty({ description: 'Nome do sprint' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Objetivo do sprint' })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiProperty({ description: 'Data de início do sprint' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Data de término do sprint' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'ID do workspace' })
  @IsUUID()
  workspaceId: string;
}

