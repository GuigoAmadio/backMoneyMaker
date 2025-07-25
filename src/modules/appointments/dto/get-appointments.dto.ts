import { IsOptional, IsUUID, IsString, IsDateString, IsIn, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetAppointmentsDto {
  @ApiPropertyOptional({ description: 'ID do funcionário (psicanalista)', type: String })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'ID do usuario (cliente do psicanalista)', type: String })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'ID do cliente', type: String })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Status do agendamento',
    enum: ['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
  })
  @IsOptional()
  @IsIn(['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Data do agendamento (YYYY-MM-DD)', type: String })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Buscar por nome do usuário', type: String })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Data inicial (YYYY-MM-DD)', type: String })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final (YYYY-MM-DD)', type: String })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'ID da categoria', type: String })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Página da paginação', type: Number })
  @IsOptional()
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ description: 'Limite de itens por página', type: Number })
  @IsOptional()
  @IsInt()
  limit?: number;

  @ApiPropertyOptional({ description: 'Campo para ordenação', type: String })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiPropertyOptional({ description: 'Direção da ordenação', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  orderDirection?: 'asc' | 'desc';
}
