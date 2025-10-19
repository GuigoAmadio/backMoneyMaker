import { IsUUID, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MoveTaskDto {
  @ApiProperty({ description: 'ID da coluna de destino' })
  @IsUUID()
  columnId: string;

  @ApiPropertyOptional({ description: 'Nova ordem na coluna' })
  @IsOptional()
  @IsNumber()
  order?: number;
}

