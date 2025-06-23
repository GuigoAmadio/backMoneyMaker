import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
  IsUrl,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Nome completo do funcionário',
    example: 'João Silva',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Email do funcionário',
    example: 'joao@empresa.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Telefone do funcionário',
    example: '(11) 99999-9999',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'URL do avatar do funcionário',
    example: 'https://exemplo.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiProperty({
    description: 'Cargo/posição do funcionário',
    example: 'Atendente',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  position: string;

  @ApiPropertyOptional({
    description: 'Descrição adicional do funcionário',
    example: 'Especialista em atendimento ao cliente',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Horários de trabalho em formato JSON',
    example: {
      monday: { start: '08:00', end: '18:00' },
      tuesday: { start: '08:00', end: '18:00' },
      wednesday: { start: '08:00', end: '18:00' },
      thursday: { start: '08:00', end: '18:00' },
      friday: { start: '08:00', end: '18:00' },
      saturday: { start: '08:00', end: '14:00' },
      sunday: null,
    },
  })
  @IsOptional()
  @IsObject()
  workingHours?: object;

  @ApiPropertyOptional({
    description: 'Status ativo/inativo do funcionário',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
