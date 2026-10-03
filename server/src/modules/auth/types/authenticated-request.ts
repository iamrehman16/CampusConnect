import type { Request } from 'express';
import type { CurrentUser } from './current-user';

export type AuthenticatedRequest = Request & { user: CurrentUser };
