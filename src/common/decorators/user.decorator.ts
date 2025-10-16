// backend/src/common/decorators/user.decorator.ts
import { createParamDecorator, ExecutionContext, Logger } from '@nestjs/common';

/**
 * Decorator para extrair o ID do usuário da requisição
 */
export const User = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  const logger = new Logger('UserDecorator');

  logger.log('🔍 User Decorator: Iniciando extração do userId');
  logger.log(` User Decorator: request.user: ${JSON.stringify(request.user)}`);

  // Extrair userId do JWT
  const userId = request.user?.id || request.user?.userId;
  logger.log(` User Decorator: userId extraído: ${userId}`);

  if (!userId) {
    logger.warn('⚠️ User Decorator: userId não encontrado na requisição');
  }

  return userId;
});

/**
 * Decorator para injetar dados completos do usuário autenticado
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const logger = new Logger('CurrentUserDecorator');

  logger.log('🔍 CurrentUser Decorator: Extraindo dados completos do usuário');
  logger.log(` CurrentUser Decorator: request.user: ${JSON.stringify(request.user)}`);

  return request.user;
});
