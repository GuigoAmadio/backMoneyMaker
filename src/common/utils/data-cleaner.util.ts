/**
 * Remove campos undefined e null de um objeto
 * @param data - Objeto a ser limpo
 * @returns Objeto limpo sem campos undefined/null
 */
export function cleanData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = cleanData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/**
 * Remove campos undefined de um objeto de filtros para queries
 * @param filters - Objeto de filtros
 * @returns Objeto de filtros limpo
 */
export function cleanFilters(filters: any): any {
  if (!filters || typeof filters !== 'object') {
    return {};
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  return cleaned;
}
