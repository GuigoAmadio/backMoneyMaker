import { Module } from '@nestjs/common';
import { CacheEventsController } from './cache-events.controller';
import { CacheEventsService } from './cache-events.service';

@Module({
  controllers: [CacheEventsController],
  providers: [CacheEventsService],
  exports: [CacheEventsService], // Exportar para usar em outros módulos
})
export class CacheEventsModule {}
