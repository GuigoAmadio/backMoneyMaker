import { Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerInterceptor } from './logger.interceptor';
import * as winston from 'winston';

@Module({
  providers: [
    {
      provide: 'WINSTON_MODULE_PROVIDER',
      useFactory: () => {
        console.log('🔧 Configurando Winston Logger...');
        console.log('🔧 LOG_LEVEL:', process.env.LOG_LEVEL || 'debug');
        
        const logger = winston.createLogger({
          level: process.env.LOG_LEVEL || 'debug', // Permitir logs de debug
          transports: [
            new winston.transports.Console({
              level: process.env.LOG_LEVEL || 'debug', // Console também com debug
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.colorize(),
                winston.format.printf((info) => {
                  return `${info.timestamp} [${info.context}] ${info.level}: ${info.message}${info.trace ? `\n${info.trace}` : ''}`;
                }),
              ),
            }),
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
              format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
              level: process.env.LOG_LEVEL || 'debug', // Arquivo também com debug
              format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            }),
            new winston.transports.File({
              filename: 'logs/access.log',
              level: 'info',
              format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            }),
          ],
        });
        
        console.log('✅ Winston Logger configurado com sucesso!');
        return logger;
      },
    },
    LoggerService,
    LoggerInterceptor,
  ],
  exports: [LoggerService, LoggerInterceptor],
})
export class LoggerModule {}
