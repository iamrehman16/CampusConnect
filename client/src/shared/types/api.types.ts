/**
 * Generic paginated response from the server.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
}

/**
 * Standard API error shape from the server (NestJS).
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}


export interface PaginationParams{
  page?:number;
  limit?:number;
}

export const PAGE_LIMIT = 10;