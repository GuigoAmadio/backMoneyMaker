/**
 * Interface padronizada para todas as respostas da API
 */
export interface ApiResponse<T = any> {
  /**
   * Indica se a operação foi bem-sucedida
   */
  success: boolean;

  /**
   * Dados retornados pela operação
   */
  data?: T;

  /**
   * Mensagem descritiva sobre a operação
   */
  message?: string;

  /**
   * Informações sobre erros (quando success = false)
   */
  error?: ApiError;

  /**
   * Metadados adicionais (paginação, etc)
   */
  meta?: ApiResponseMeta;
}

/**
 * Interface para erros da API
 */
export interface ApiError {
  /**
   * Código de erro HTTP
   */
  statusCode: number;

  /**
   * Tipo/categoria do erro
   */
  type: string;

  /**
   * Mensagem de erro legível
   */
  message: string;

  /**
   * Detalhes adicionais do erro (ex: validação de campos)
   */
  details?: any;

  /**
   * Timestamp do erro
   */
  timestamp?: string;

  /**
   * Path da requisição que gerou o erro
   */
  path?: string;
}

/**
 * Interface para metadados de resposta (paginação, etc)
 */
export interface ApiResponseMeta {
  /**
   * Página atual (para respostas paginadas)
   */
  page?: number;

  /**
   * Limite de itens por página
   */
  limit?: number;

  /**
   * Total de itens disponíveis
   */
  total?: number;

  /**
   * Total de páginas
   */
  totalPages?: number;

  /**
   * Indica se há próxima página
   */
  hasNextPage?: boolean;

  /**
   * Indica se há página anterior
   */
  hasPreviousPage?: boolean;

  /**
   * Metadados adicionais específicos da rota
   */
  [key: string]: any;
}

/**
 * Interface para respostas paginadas
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: Required<Pick<ApiResponseMeta, 'page' | 'limit' | 'total' | 'totalPages'>>;
}

/**
 * Helper para criar respostas de sucesso padronizadas
 */
export class ResponseBuilder {
  static success<T>(data: T, message?: string, meta?: ApiResponseMeta): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      meta,
    };
  }

  static error(
    statusCode: number,
    type: string,
    message: string,
    details?: any,
    path?: string,
  ): ApiResponse {
    return {
      success: false,
      error: {
        statusCode,
        type,
        message,
        details,
        timestamp: new Date().toISOString(),
        path,
      },
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string,
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data,
      message,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
