import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Token de verificação de email',
    example: 'abc123...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token é obrigatório' })
  token: string;
}
