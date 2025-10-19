import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCommentDto {
  @ApiProperty({ description: 'Conteúdo do comentário' })
  @IsString()
  content: string;
}

