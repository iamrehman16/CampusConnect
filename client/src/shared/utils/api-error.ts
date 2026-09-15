// shared/utils/api-error.ts
import type { AxiosError } from 'axios';
import type { ApiError } from '../api/api.errors';

export function getApiErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiError>;

  // request never reached the server
  if (!axiosError.response) {
    return 'Network error. Please check your connection.';
  }

  const { status, data } = axiosError.response;

  // server crashed — don't surface internals
  if (status >= 500) {
    return 'Server error. Please try again later.';
  }

  // permission error — fixed human readable, backend message not useful here
  if (status === 403) {
    return "You don't have permission to do this.";
  }

  // 400, 404, 409 etc — backend message is meaningful, surface it
  // message is always string[] per our filter contract
  return data?.message?.[0] ?? 'Something went wrong.';
}