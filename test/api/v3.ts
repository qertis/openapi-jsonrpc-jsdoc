interface V3Params {
  id: string;
  limit?: number;
}

/**
 * @json-rpc
 * @description TypeScript API v3
 * @param {object} params - параметры запроса
 * @param {string} params.id - идентификатор
 * @param {number} [params.limit] - ограничение выборки
 * @returns {Promise<object>}
 */
export default function v3(params: V3Params): Promise<object> {
  return Promise.resolve({ id: params.id });
}
