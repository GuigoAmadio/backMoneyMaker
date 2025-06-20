import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ description: 'ID do usuário' })
  id: string;

  @ApiProperty({ description: 'Nome do usuário' })
  name: string;

  @ApiProperty({ description: 'Email do usuário' })
  email: string;

  @ApiProperty({ description: 'Telefone do usuário', required: false })
  phone?: string;

  @ApiProperty({ description: 'Role do usuário', enum: ['SUPER_ADMIN', 'ADMIN', 'CLIENT'] })
  role: string;

  @ApiProperty({ description: 'Status do usuário', enum: ['ACTIVE', 'INACTIVE', 'PENDING'] })
  status: string;

  @ApiProperty({ description: 'ID do cliente' })
  clientId: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  @ApiProperty({ description: 'Último login', required: false })
  lastLogin?: Date;

  @ApiProperty({ description: 'Informações do cliente', required: false })
  client?: {
    id: string;
    name: string;
    status: string;
  };
}

export class LoginDataDto {
  @ApiProperty({ description: 'Token de acesso JWT' })
  token: string;

  @ApiProperty({ description: 'ID do cliente' })
  client_id: string;

  @ApiProperty({ description: 'Informações do usuário', type: LoginUserDto })
  user: LoginUserDto;

  @ApiProperty({ description: 'Refresh token' })
  refresh_token: string;

  @ApiProperty({ description: 'Tempo de expiração do token' })
  expires_in: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Indica se a operação foi bem-sucedida' })
  success: boolean;

  @ApiProperty({ description: 'Mensagem de resposta' })
  message: string;

  @ApiProperty({ description: 'Dados do login', type: LoginDataDto })
  data: LoginDataDto;
}
