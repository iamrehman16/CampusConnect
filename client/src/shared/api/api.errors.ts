/**
 * Standardized API error shape matching the server's NestJS error format.
 */
export interface ApiError {
  statusCode: number;
  message: string[];
  error: string;
}

/**
 * Extracts a user-friendly error message from any error shape.
 */
export function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: ApiError } }).response;
    const data = response?.data;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message[0] : data.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
