import { Module } from '@nestjs/common';
import { AnnotationsService } from './annotations.service';
import { AnnotationsController } from './annotations.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [AnnotationsController],
  providers: [AnnotationsService, PrismaService],
  exports: [AnnotationsService],
})
export class AnnotationsModule {}
