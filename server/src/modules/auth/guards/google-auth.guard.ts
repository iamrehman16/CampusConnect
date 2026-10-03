import {
  CanActivate,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import googleConfig from '../config/google.config';

@Injectable()
export class GoogleEnabledGuard implements CanActivate {
  constructor(
    @Inject(googleConfig.KEY)
    private readonly config: ConfigType<typeof googleConfig>,
  ) {}

  canActivate(): boolean {
    if (!this.config.enabled) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }
    return true;
  }
}

/**
 * Never throws: a denied consent screen or a Google failure must end in a
 * redirect back to the client with an error code, not a JSON error page in
 * the middle of a browser redirect chain. The controller reads `req.user`.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  handleRequest<TUser>(err: unknown, user: TUser | false): TUser {
    if (err) {
      this.logger.error(
        'Google sign-in failed',
        err instanceof Error ? err.stack : JSON.stringify(err),
      );
    }
    // Typed as TUser to satisfy the base signature; undefined means "failed".
    return (user || undefined) as TUser;
  }
}
