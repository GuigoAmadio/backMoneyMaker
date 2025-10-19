import { IsUUID, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTaskDto {
  @ApiProperty({ description: 'IDs dos usuários a serem atribuídos' })
  @IsArray()
  @IsUUID(undefined, { each: true })
  userIds: string[];
}

