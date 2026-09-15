import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import refreshJwtConfig from './config/refresh-jwt.config';
import type { ConfigType } from '@nestjs/config';
import argon2 from 'argon2';
import { CurrentUser } from './types/current-user';
import { CompleteOnboardingDto } from '../user/dto/complete-onboarding.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private readonly refreshtTokenConfig: ConfigType<typeof refreshJwtConfig>,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.userService.createUser(dto);
    return this.login(user._id.toString());
  }

  async completeOnboarding(userId: string, dto: CompleteOnboardingDto) {
    return this.userService.completeOnboarding(userId, dto);
  }
  async login(userId: string) {
    const { accessToken, refreshToken } = await this.generateTokens(userId);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.userService.updateRefreshToken(userId, hashedRefreshToken);

    return {
      id: userId,
      accessToken,
      refreshToken,
    };
  }
  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException('User not found!');
    const isPasswordMatch = await compare(password, user.password);
    if (!isPasswordMatch)
      throw new UnauthorizedException('Invalid Credentials');

    return { id: user._id.toString() };
  }
  async refreshToken(userId: string) {
    const { accessToken, refreshToken } = await this.generateTokens(userId);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.userService.updateRefreshToken(userId, hashedRefreshToken);

    return {
      id: userId,
      accessToken,
      refreshToken,
    };
  }

  async generateTokens(userId: string) {
    const payload: AuthJwtPayload = { sub: userId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshtTokenConfig),
    ]);

    return { accessToken, refreshToken };
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.userService.findOneWithHashedRefreshToken(userId);
    if (!user || !user.hashedRefreshToken)
      throw new UnauthorizedException('Invalid Refresh Token!');

    const isMatch = await argon2.verify(user.hashedRefreshToken, refreshToken);
    if (!isMatch)
      throw new UnauthorizedException('Expired or Invalid RefreshToken!');

    return { id: userId };
  }

  async signout(userId: string) {
    await this.userService.updateRefreshToken(userId, null);
  }

  // auth.service.ts
  async validateJwtUser(userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) throw new UnauthorizedException('User not found');
    const currentUser: CurrentUser = {
      id: user._id.toString(),
      role: user.role,
      isOnboarded: user.isOnboarded!, // add this
    };
    return currentUser;
  }
}
