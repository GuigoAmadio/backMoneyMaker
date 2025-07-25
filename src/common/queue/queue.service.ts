import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@InjectQueue('default') private readonly defaultQueue: Queue) {}

  async addJob(data: any) {
    this.logger.log('Adicionando job à fila padrão', data);
    return this.defaultQueue.add(data);
  }

  async getJobs() {
    return this.defaultQueue.getJobs(['active', 'waiting', 'completed', 'failed']);
  }

  async cleanQueue() {
    this.logger.warn('Limpando todos os jobs da fila padrão');
    return this.defaultQueue.clean(0);
  }
}
