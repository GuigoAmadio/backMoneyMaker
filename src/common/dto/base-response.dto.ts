import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<T> {
  @ApiProperty({ description: 'Indica se a operação foi bem-sucedida' })
  success: boolean;

  @ApiProperty({ description: 'Dados da resposta' })
  data: T;

  @ApiProperty({ description: 'Mensagem da resposta', required: false })
  message?: string;

  @ApiProperty({ description: 'Timestamp da resposta' })
  timestamp: string;

  @ApiProperty({ description: 'Caminho da requisição' })
  path: string;

  @ApiProperty({ description: 'Método HTTP da requisição' })
  method: string;
}

export class ErrorResponseDto {
  @ApiProperty({ description: 'Indica que houve erro', example: false })
  success: boolean;

  @ApiProperty({ description: 'Código de status HTTP' })
  statusCode: number;

  @ApiProperty({ description: 'Mensagem de erro' })
  message: string;

  @ApiProperty({ description: 'Detalhes adicionais do erro', required: false })
  errors?: any;

  @ApiProperty({ description: 'Timestamp do erro' })
  timestamp: string;

  @ApiProperty({ description: 'Caminho da requisição' })
  path: string;

  @ApiProperty({ description: 'Método HTTP da requisição' })
  method: string;
} 