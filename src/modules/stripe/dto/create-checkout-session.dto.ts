import { IsString, IsEmail, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'Price ID do produto no Stripe',
    example: 'price_1234567890',
  })
  @IsString()
  priceId: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'cliente@exemplo.com',
  })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({
    description: 'Nome do cliente',
    example: 'João Silva',
  })
  @IsString()
  customerName: string;

  @ApiPropertyOptional({
    description: 'Nome da empresa',
    example: 'Empresa LTDA',
  })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({
    description: 'Ciclo de cobrança',
    enum: ['monthly', 'yearly'],
    example: 'monthly',
  })
  @IsEnum(['monthly', 'yearly'])
  billingCycle: 'monthly' | 'yearly';

  @ApiPropertyOptional({
    description: 'Serviços selecionados pelo cliente',
    example: ['finance', 'calendar', 'appointments'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedServices?: string[];
}
