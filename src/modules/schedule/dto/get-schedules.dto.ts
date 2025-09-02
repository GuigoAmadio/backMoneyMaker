import { IsOptional, IsString, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleStatus, SchedulePriority, ScheduleCategory } from './create-schedule.dto';

export class GetSchedulesDto {
  @ApiPropertyOptional({ description: 'Data de início do período' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de fim do período' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Data específica' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: ScheduleStatus, description: 'Filtrar por status' })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @ApiPropertyOptional({ enum: SchedulePriority, description: 'Filtrar por prioridade' })
  @IsOptional()
  @IsEnum(SchedulePriority)
  priority?: SchedulePriority;

  @ApiPropertyOptional({ enum: ScheduleCategory, description: 'Filtrar por categoria' })
  @IsOptional()
  @IsEnum(ScheduleCategory)
  category?: ScheduleCategory;

  @ApiPropertyOptional({ description: 'ID do funcionário' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Buscar apenas agendas públicas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  publicOnly?: boolean;

  @ApiPropertyOptional({ description: 'Buscar por título ou descrição' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Página para paginação' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite de itens por página' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Campo para ordenação' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'date';

  @ApiPropertyOptional({ description: 'Direção da ordenação', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
