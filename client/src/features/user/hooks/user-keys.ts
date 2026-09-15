// features/user/api/userKeys.ts
import type { UserFilterParams } from '../types/user.dto';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserFilterParams) => [...userKeys.lists(), params] as const,
};