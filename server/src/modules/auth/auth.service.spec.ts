import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  it('should be defined', () => {
    const userService: Partial<UserService> = {};
    const jwtService: Partial<JwtService> = {};

    const service = new AuthService(
      userService as UserService,
      jwtService as JwtService,
      { secret: 'test-secret', expiresIn: '7d' },
    );

    expect(service).toBeDefined();
  });
});
