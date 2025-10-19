import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateSprintDto } from './create-sprint.dto';

export class UpdateSprintDto extends PartialType(
  OmitType(CreateSprintDto, ['workspaceId'] as const),
) {}

