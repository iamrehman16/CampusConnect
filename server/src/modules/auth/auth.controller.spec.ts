import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  it('should be defined', () => {
    const authService: Partial<AuthService> = {};
    const controller = new AuthController(authService as AuthService);

    expect(controller).toBeDefined();
  });
});
