import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Configuração de serviços
  const configService = app.get(ConfigService);

  // Configurações de segurança
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Compressão
  app.use(compression());

  // CORS configurável - Incluindo domínios de produção
  const corsOrigins = configService.get('CORS_ORIGINS')?.split(',') || [
    'https://api.expatriamente.com',
    'http://localhost:3000', // Expatriamente frontend
    'http://localhost:3001', // BemMeCare frontend
    'http://localhost:3002', // Outros frontends
    'https://www.expatriamente.com', // Frontend Expatriamente
    'https://expatriamente.com', // Frontend Expatriamente (sem www)
    'https://api.expatriamente.com', // Backend API
  ];

  // Em desenvolvimento, permitir todas as origens para facilitar testes
  const isDevelopment = configService.get('NODE_ENV') === 'development';
  const allowedOrigins = isDevelopment ? true : corsOrigins;

  app.enableCors({
    origin: allowedOrigins,
    methods: configService.get('CORS_METHODS') || 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: configService.get('CORS_CREDENTIALS') === 'true' || true, // Habilitar credentials por padrão
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'x-client-id',
      'x-api-key',
      'Cache-Control',
      'Last-Event-ID', // Para SSE
      'Cache-Control', // Para SSE
    ],
  });

  // Prefixo global (excluindo rotas de métricas)
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'metrics', method: RequestMethod.GET },
      { path: 'metrics/json', method: RequestMethod.GET },
    ],
  });

  // Versionamento da API (após o prefixo global)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: configService.get('API_VERSION') || 'v1',
  });
  logger.log('🌐 Global prefix configurado: /api (excluindo métricas e health)');

  // Pipes globais de validação
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filtros globais de exceção
  // Esta linha registra um filtro global de exceções personalizado (HttpExceptionFilter) na aplicação NestJS.
  // Isso significa que qualquer erro ou exceção lançada durante o processamento das requisições HTTP será interceptada por esse filtro,
  // permitindo tratar, formatar e responder os erros de forma padronizada para toda a API.
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptors globais
  app.useGlobalInterceptors(new TransformInterceptor());
  // MetricsInterceptor é registrado via APP_INTERCEPTOR no AppModule

  // Configuração do Swagger
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('MoneyMaker Backend API')
      .setDescription('Backend SaaS Multi-tenant para soluções digitais')
      .setVersion('1.0')
      .addBearerAuth(
        {
          description: 'JWT Authorization header usando Bearer scheme',
          name: 'Authorization',
          bearerFormat: 'JWT',
          scheme: 'Bearer',
          type: 'http',
          in: 'Header',
        },
        'access-token',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'x-client-id',
          in: 'header',
          description: 'ID do cliente para multi-tenancy',
        },
        'client-id',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Porta da aplicação
  const port = configService.get('APP_PORT') || 3000;
  logger.log(`🚀 Aplicação rodando na porta ${port}`);
  logger.log(`📚 Documentação disponível em: http://localhost:${port}/api/docs`);
  logger.log(`📊 Métricas disponíveis em: http://localhost:${port}/metrics`);
  logger.log(`🌍 Ambiente: ${configService.get('NODE_ENV')}`);

  // Endpoint /metrics será fornecido pelo MetricsController
  // que está configurado para ignorar o prefixo global

  await app.listen(port);
}

bootstrap();
