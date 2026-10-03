import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import googleConfig from './config/google.config';
import type { ConfigType } from '@nestjs/config';

describe('AuthController', () => {
  it('should be defined', () => {
    const authService: Partial<AuthService> = {};
    const controller = new AuthController(
      authService as AuthService,
      {} as ConfigType<typeof googleConfig>,
    );

    expect(controller).toBeDefined();
  });
});
