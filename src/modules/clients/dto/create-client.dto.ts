import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ description: 'Nome do cliente', example: 'João Silva' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email do cliente', example: 'joao@exemplo.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Telefone do cliente', example: '(11) 99999-9999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Status do cliente',
    enum: ['ACTIVE', 'INACTIVE'],
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
}
