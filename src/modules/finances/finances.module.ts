import { Module } from '@nestjs/common';
import { FinancesController } from './finances.controller';
import { FinancesService } from './finances.service';
import { WorkspaceFinancesController } from './workspace-finances.controller';
import { WorkspaceFinancesService } from './workspace-finances.service';
import { GoalsBudgetsController } from './goals-budgets.controller';
import { GoalsBudgetsService } from './goals-budgets.service';
import { WorkspaceAuditService } from './workspace-audit.service';
import { WorkspaceNotificationsService } from './workspace-notifications.service';
import { CacheEventsModule } from '../../cache-events/cache-events.module';

@Module({
  imports: [CacheEventsModule],
  controllers: [FinancesController, WorkspaceFinancesController, GoalsBudgetsController],
  providers: [
    FinancesService,
    WorkspaceFinancesService,
    GoalsBudgetsService,
    WorkspaceAuditService,
    WorkspaceNotificationsService,
  ],
  exports: [
    FinancesService,
    WorkspaceFinancesService,
    GoalsBudgetsService,
    WorkspaceAuditService,
    WorkspaceNotificationsService,
  ],
})
export class FinancesModule {}
