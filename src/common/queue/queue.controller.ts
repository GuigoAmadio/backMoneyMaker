import { Controller, Get, Post, Body } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('add')
  async addJob(@Body() data: any) {
    return this.queueService.addJob(data);
  }

  @Get('jobs')
  async getJobs() {
    return this.queueService.getJobs();
  }

  @Post('clean')
  async cleanQueue() {
    return this.queueService.cleanQueue();
  }
}
