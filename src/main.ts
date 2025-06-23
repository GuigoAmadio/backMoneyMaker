import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
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

  // CORS configurável - Incluindo porta 3001 para BemMeCare
  const corsOrigins = configService.get('CORS_ORIGINS')?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001', // BemMeCare frontend
    'http://localhost:3002', // Outros frontends
  ];
  app.enableCors({
    origin: corsOrigins,
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
    ],
  });

  // Versionamento da API
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: configService.get('API_VERSION') || 'v1',
  });

  // Prefixo global
  app.setGlobalPrefix('api');

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
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptors globais
  app.useGlobalInterceptors(new TransformInterceptor());

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

  await app.listen(port);

  console.log(`🚀 Aplicação rodando na porta ${port}`);
  console.log(`📚 Documentação disponível em: http://localhost:${port}/api/docs`);
  console.log(`🌍 Ambiente: ${configService.get('NODE_ENV')}`);
}

bootstrap();
