import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
  Matches,
  IsEnum,
  IsJSON,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({
    description: 'Nome da empresa',
    example: 'Restaurante do João',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Slug único para identificação (usado em subdomínios)',
    example: 'restaurante-joao',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug: string;

  @ApiProperty({
    description: 'Email da empresa',
    example: 'contato@restaurantejoao.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Telefone da empresa',
    example: '(11) 99999-9999',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'URL do logo da empresa',
  })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Website da empresa',
    example: 'https://restaurantejoao.com',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Status do cliente',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' = 'ACTIVE';

  @ApiPropertyOptional({
    description: 'Plano de assinatura',
    example: 'basic',
    default: 'basic',
  })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({
    description: 'Configurações específicas do cliente (JSON)',
    example: '{"theme": "dark", "features": ["appointments", "orders"]}',
  })
  @IsOptional()
  @IsJSON()
  settings?: string;

  @ApiPropertyOptional({
    description: 'Data de expiração da assinatura',
  })
  @IsOptional()
  expiresAt?: Date;
}
