import { Process, Processor } from '@nestjs/bull';
import { Inject, forwardRef, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TelegramService } from '../notifications/telegram.service';

@Processor('default')
export class QueueProcessor {
  private readonly logger = new Logger(QueueProcessor.name);

  constructor(
    @Inject(forwardRef(() => TelegramService))
    private readonly telegramService: TelegramService,
  ) {}

  @Process()
  async handleJob(job: Job) {
    this.logger.log(`Processando job: ${JSON.stringify(job.data)}`);
    // Simulação de envio de e-mail
    if (job.data.tipo === 'email') {
      this.logger.log(`Enviando e-mail para: ${job.data.payload?.to}`);
      // Simule delay
      await new Promise((res) => setTimeout(res, 1000));
      this.logger.log('E-mail enviado com sucesso!');
    } else if (job.data.tipo === 'telegram') {
      this.logger.log(`Enviando mensagem Telegram para: ${job.data.payload?.chatId}`);
      await this.telegramService.sendCustomAlert(
        'info',
        'Notificação via fila',
        job.data.payload?.message,
      );
      this.logger.log('Mensagem Telegram enviada via fila!');
    } else {
      this.logger.warn('Tipo de job não reconhecido:', job.data);
    }
    return true;
  }
}
