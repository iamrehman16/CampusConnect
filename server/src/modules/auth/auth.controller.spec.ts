import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guards';
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

describe('AuthController refresh route', () => {
  it('bypasses the global access-token guard (the caller only has a refresh token)', () => {
    const guard = new JwtAuthGuard(new Reflector());
    const context = {
      getHandler: () => {
        // Reflector reads the decorator metadata off the handler function.
        const proto = AuthController.prototype as unknown as Record<
          string,
          () => void
        >;
        return proto.refreshToken;
      },
      getClass: () => AuthController,
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('keeps authenticated routes behind the access-token guard', () => {
    const guard = new JwtAuthGuard(new Reflector());
    const context = {
      getHandler: () => {
        const proto = AuthController.prototype as unknown as Record<
          string,
          () => void
        >;
        return proto.signout;
      },
      getClass: () => AuthController,
    } as unknown as ExecutionContext;
    const superCanActivate = jest
      .spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype) as JwtAuthGuard,
        'canActivate',
      )
      .mockReturnValue(false);

    expect(guard.canActivate(context)).toBe(false);
    superCanActivate.mockRestore();
  });
});
