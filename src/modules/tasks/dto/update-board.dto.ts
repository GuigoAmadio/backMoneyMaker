import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateBoardDto } from './create-board.dto';

export class UpdateBoardDto extends PartialType(
  OmitType(CreateBoardDto, ['workspaceId', 'columns'] as const),
) {}

