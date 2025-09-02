import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsEnum,
  IsArray,
  IsJSON,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ScheduleStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED',
}

export enum SchedulePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ScheduleCategory {
  WORK = 'WORK',
  PERSONAL = 'PERSONAL',
  MEETING = 'MEETING',
  APPOINTMENT = 'APPOINTMENT',
  REMINDER = 'REMINDER',
  OTHER = 'OTHER',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: SchedulePriority;
  dueTime?: string;
}

export interface Reminder {
  type: 'email' | 'notification' | 'sms';
  minutesBefore: number;
  enabled: boolean;
}

export class CreateScheduleDto {
  @ApiProperty({ description: 'Título da agenda' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Descrição da agenda' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Data específica do calendário' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Lista de tarefas do dia', type: [Object] })
  @IsOptional()
  @IsArray()
  tasks?: Task[];

  @ApiPropertyOptional({ enum: ScheduleStatus, description: 'Status da agenda' })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @ApiPropertyOptional({ enum: SchedulePriority, description: 'Prioridade da agenda' })
  @IsOptional()
  @IsEnum(SchedulePriority)
  priority?: SchedulePriority;

  @ApiPropertyOptional({ description: 'Horário de início' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Horário de fim' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Se é um evento de dia inteiro' })
  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @ApiPropertyOptional({ description: 'Se é um evento recorrente' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: 'Padrão de recorrência', type: Object })
  @IsOptional()
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: string;
    occurrences?: number;
  };

  @ApiPropertyOptional({ description: 'Cor para categorização visual' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ enum: ScheduleCategory, description: 'Categoria da agenda' })
  @IsOptional()
  @IsEnum(ScheduleCategory)
  category?: ScheduleCategory;

  @ApiPropertyOptional({ description: 'Configurações de lembretes', type: [Object] })
  @IsOptional()
  @IsArray()
  reminders?: Reminder[];

  @ApiPropertyOptional({ description: 'URLs de anexos', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({ description: 'Se é visível para outros usuários' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'ID do funcionário designado' })
  @IsOptional()
  @IsString()
  employeeId?: string;
}
