import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const startTime = Date.now();

    // 📊 Log inicial da exceção
    this.logger.error(`🚨 === HttpExceptionFilter: Exceção capturada ===`, {
      exceptionType: exception?.constructor?.name || 'Unknown',
      exceptionMessage: exception instanceof Error ? exception.message : String(exception),
      requestId: request.headers['x-request-id'] || 'no-request-id',
      userAgent: request.headers['user-agent'],
      ip: request.ip || request.connection?.remoteAddress,
    });

    // 📋 Log detalhado da requisição
    this.logger.error(`📋 === HttpExceptionFilter: Contexto da requisição ===`, {
      method: request.method,
      url: request.url,
      originalUrl: request.originalUrl,
      path: request.path,
      query: request.query,
      params: request.params,
      headers: {
        'content-type': request.headers['content-type'],
        authorization: request.headers['authorization'] ? '[REDACTED]' : undefined,
        'x-client-id': request.headers['x-client-id'],
        'x-api-key': request.headers['x-api-key'] ? '[REDACTED]' : undefined,
        'user-agent': request.headers['user-agent'],
      },
      body: this.sanitizeRequestBody(request.body),
      user: request.user
        ? {
            id: (request.user as any)?.id,
            email: (request.user as any)?.email,
            role: (request.user as any)?.role,
            clientId: (request.user as any)?.clientId,
          }
        : null,
      clientId: (request as any).clientId,
    });

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';
    let errors: any = null;
    let errorType = 'UNKNOWN_ERROR';

    // 🔍 Classificação e tratamento de exceções
    if (exception instanceof HttpException) {
      errorType = 'HTTP_EXCEPTION';
      status = exception.getStatus();
      const responseBody = exception.getResponse();

      this.logger.error(`🔴 === HttpExceptionFilter: HTTP Exception detectada ===`, {
        exceptionName: exception.constructor.name,
        statusCode: status,
        originalMessage: exception.message,
        responseBody,
      });

      if (typeof responseBody === 'object') {
        message = (responseBody as any).message || exception.message;
        errors = (responseBody as any).errors || null;
      } else {
        message = responseBody as string;
      }
    }
    // 🗄️ Tratamento de erros do Prisma
    else if (exception instanceof PrismaClientKnownRequestError) {
      errorType = 'PRISMA_ERROR';
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;

      this.logger.error(`🗄️ === HttpExceptionFilter: Erro do Prisma detectado ===`, {
        prismaErrorCode: exception.code,
        prismaErrorMessage: exception.message,
        prismaErrorMeta: exception.meta,
        mappedStatus: status,
        mappedMessage: message,
      });
    }
    // ⚠️ Erros genéricos de JavaScript/Node.js
    else if (exception instanceof Error) {
      errorType = 'GENERIC_ERROR';
      message = exception.message;

      this.logger.error(`⚠️ === HttpExceptionFilter: Erro genérico detectado ===`, {
        errorName: exception.name,
        errorMessage: exception.message,
        stack: exception.stack,
        cause: (exception as any).cause,
      });
    }
    // 🚫 Erros completamente desconhecidos
    else {
      errorType = 'UNKNOWN_ERROR';
      this.logger.error(`🚫 === HttpExceptionFilter: Erro completamente desconhecido ===`, {
        exceptionType: typeof exception,
        exceptionValue: exception,
        stringified: String(exception),
      });
    }

    // 📊 Log de performance e timing
    const processingTime = Date.now() - startTime;
    this.logger.error(`⏱️ === HttpExceptionFilter: Performance ===`, {
      processingTimeMs: processingTime,
      errorType,
      statusCode: status,
      hasStack: exception instanceof Error && !!exception.stack,
      hasCause: exception instanceof Error && !!(exception as any).cause,
    });

    // 📤 Log da resposta que será enviada
    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      errorType,
      requestId: request.headers['x-request-id'] || 'no-request-id',
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
        debug: {
          exceptionType: exception?.constructor?.name,
          originalException: exception,
          processingTimeMs: processingTime,
        },
      }),
    };

    this.logger.error(`📤 === HttpExceptionFilter: Resposta sendo enviada ===`, {
      statusCode: status,
      responseSize: JSON.stringify(errorResponse).length,
      errorType,
      hasErrors: !!errors,
      errorCount: Array.isArray(errors) ? errors.length : errors ? 1 : 0,
      includesStack: !!(errorResponse as any).stack,
      processingTimeMs: processingTime,
    });

    // 🎯 Log final resumido
    this.logger.error(`🎯 === HttpExceptionFilter: Resumo final ===`, {
      summary: `${request.method} ${request.url} → ${status} ${errorType}`,
      message,
      statusCode: status,
      errorType,
      processingTimeMs: processingTime,
      userId: (request.user as any)?.id || 'anonymous',
      clientId: (request as any).clientId || 'no-client',
      userAgent: request.headers['user-agent']?.substring(0, 100) || 'unknown',
    });

    response.status(status).json(errorResponse);
  }

  private handlePrismaError(error: PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    this.logger.debug(`🔧 === HttpExceptionFilter: Processando erro do Prisma ${error.code} ===`, {
      code: error.code,
      message: error.message,
      meta: error.meta,
      clientVersion: error.clientVersion,
    });

    switch (error.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: 'Recurso já existe com esses dados únicos',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Recurso não encontrado',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Violação de chave estrangeira',
        };
      case 'P2004':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Violação de restrição no banco de dados',
        };
      default:
        this.logger.warn(
          `⚠️ === HttpExceptionFilter: Código de erro Prisma não mapeado: ${error.code} ===`,
        );
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Erro no banco de dados',
        };
    }
  }

  /**
   * Sanitiza o body da requisição removendo informações sensíveis para logs
   */
  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'apiKey',
      'accessToken',
      'refreshToken',
      'privateKey',
      'certificate',
      'ssn',
      'cpf',
      'creditCard',
      'cvv',
      'pin',
    ];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Limitar tamanho do body para logs (máximo 1000 caracteres)
    const bodyString = JSON.stringify(sanitized);
    if (bodyString.length > 1000) {
      return {
        ...sanitized,
        _truncated: true,
        _originalSize: bodyString.length,
      };
    }

    return sanitized;
  }
}
