import { UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { compare } from 'bcrypt';
import argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { UserStatus } from '../user/enums/user-status.enum';
import { JwtService } from '@nestjs/jwt';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));
jest.mock('argon2', () => ({
  __esModule: true,
  default: { verify: jest.fn() },
}));

function build(userService: Partial<UserService>) {
  return new AuthService(
    userService as UserService,
    {} as Partial<JwtService> as JwtService,
    { secret: 'test-secret', expiresIn: '7d' },
  );
}

const user = (accountStatus: UserStatus) => ({
  _id: new Types.ObjectId(),
  password: 'hash',
  hashedRefreshToken: 'rt-hash',
  role: 'student',
  isOnboarded: true,
  accountStatus,
});

describe('AuthService', () => {
  it('should be defined', () => {
    expect(build({})).toBeDefined();
  });

  describe('account suspension', () => {
    beforeEach(() => {
      (compare as jest.Mock).mockResolvedValue(true);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
    });

    it('blocks sign-in for a suspended account', async () => {
      const service = build({
        findByEmail: jest.fn().mockResolvedValue(user(UserStatus.SUSPENDED)),
      });

      await expect(service.validateUser('a@b.c', 'pw')).rejects.toThrow(
        'suspended',
      );
    });

    it("doesn't reveal suspension when the password is wrong", async () => {
      (compare as jest.Mock).mockResolvedValue(false);
      const service = build({
        findByEmail: jest.fn().mockResolvedValue(user(UserStatus.SUSPENDED)),
      });

      await expect(service.validateUser('a@b.c', 'bad')).rejects.toThrow(
        'Invalid Credentials',
      );
    });

    it('still signs in an active account', async () => {
      const u = user(UserStatus.ACTIVE);
      const service = build({ findByEmail: jest.fn().mockResolvedValue(u) });

      await expect(service.validateUser('a@b.c', 'pw')).resolves.toEqual({
        id: u._id.toString(),
      });
    });

    it('rejects an already-issued access token once the account is suspended', async () => {
      const service = build({
        findOne: jest.fn().mockResolvedValue(user(UserStatus.SUSPENDED)),
      });

      await expect(service.validateJwtUser('x')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('accepts the access token of an active account', async () => {
      const u = user(UserStatus.ACTIVE);
      const service = build({ findOne: jest.fn().mockResolvedValue(u) });

      await expect(service.validateJwtUser('x')).resolves.toMatchObject({
        id: u._id.toString(),
      });
    });

    it('refuses to renew the session of a suspended account', async () => {
      const service = build({
        findOneWithHashedRefreshToken: jest
          .fn()
          .mockResolvedValue(user(UserStatus.SUSPENDED)),
      });

      await expect(service.validateRefreshToken('x', 'rt')).rejects.toThrow(
        'suspended',
      );
    });
  });
});
