import { UserStatus } from '../user/enums/user-status.enum';
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
import { GoogleExchangeService } from './google-exchange.service';
import type { GoogleProfile } from '../user/google-profile';
import { CompleteOnboardingDto } from '../user/dto/complete-onboarding.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly googleExchange: GoogleExchangeService,
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
  /** BACKLOG.md F2: resolves the Google profile to an account, returns a one-time code. */
  async startGoogleSignIn(profile: GoogleProfile): Promise<string> {
    const user = await this.userService.findOrCreateGoogleUser(profile);
    if (user.accountStatus === UserStatus.SUSPENDED)
      throw new UnauthorizedException('This account has been suspended');
    return this.googleExchange.issue(user._id.toString());
  }

  /** Swaps the code for the same token pair a password login issues. */
  async finishGoogleSignIn(code: string) {
    const userId = this.googleExchange.consume(code);
    if (!userId)
      throw new UnauthorizedException('Sign-in link expired or already used');
    await this.validateJwtUser(userId); // re-checks suspension
    return this.login(userId);
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    // Same message as a wrong password, so login can't be used to probe
    // which emails have accounts.
    if (!user) throw new UnauthorizedException('Invalid Credentials');
    // Google-created accounts have no password (BACKLOG.md F1).
    if (!user.password)
      throw new UnauthorizedException(
        'This account uses Google sign-in. Continue with Google instead.',
      );
    const isPasswordMatch = await compare(password, user.password);
    if (!isPasswordMatch)
      throw new UnauthorizedException('Invalid Credentials');
    // After the password check, so suspension isn't revealed to someone who
    // doesn't know the password.
    if (user.accountStatus === UserStatus.SUSPENDED)
      throw new UnauthorizedException('This account has been suspended');

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
    if (user.accountStatus === UserStatus.SUSPENDED)
      throw new UnauthorizedException('This account has been suspended');

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
    // Checked on every request (the JWT strategy reloads the user), so a
    // suspension takes effect immediately rather than when the token expires.
    if (user.accountStatus === UserStatus.SUSPENDED)
      throw new UnauthorizedException('This account has been suspended');
    const currentUser: CurrentUser = {
      id: user._id.toString(),
      role: user.role,
      isOnboarded: user.isOnboarded!, // add this
    };
    return currentUser;
  }
}
