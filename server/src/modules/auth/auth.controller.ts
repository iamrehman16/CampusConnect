import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Inject,
  Logger,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Response } from 'express';
import googleConfig from './config/google.config';
import {
  GoogleAuthGuard,
  GoogleEnabledGuard,
} from './guards/google-auth.guard';
import { GoogleExchangeDto } from './dto/google-exchange.dto';
import type { GoogleProfile } from '../user/google-profile';
import { AuthService } from './auth.service';
import { LocalAuthguard } from './guards/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { CompleteOnboardingDto } from '../user/dto/complete-onboarding.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './types/current-user';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    @Inject(googleConfig.KEY)
    private readonly google: ConfigType<typeof googleConfig>,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @UseGuards(LocalAuthguard)
  @Post('login')
  async login(@Req() req: { user: CurrentUser }) {
    return this.authService.login(req.user.id);
  }

  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  async refreshToken(@Req() req: { user: CurrentUser }) {
    return this.authService.refreshToken(req.user.id);
  }

  @Post('signout')
  async signout(@Req() req: { user: CurrentUser }) {
    return await this.authService.signout(req.user.id);
  }

  @Patch('onboarding')
  async completeOnboarding(
    @Req() req: { user: CurrentUser },
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.authService.completeOnboarding(req.user.id, dto);
  }

  /** Starts the Google consent flow (the guard issues the redirect). */
  @Public()
  @UseGuards(GoogleEnabledGuard, GoogleAuthGuard)
  @Get('google')
  googleLogin(): void {
    // handled by passport
  }

  @Public()
  @UseGuards(GoogleEnabledGuard, GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(
    @Req() req: { user?: GoogleProfile },
    @Res() res: Response,
  ) {
    const base = `${this.google.frontendUrl}/auth/google/callback`;
    // No profile: consent was denied or Google failed (logged by the guard).
    if (!req.user) return res.redirect(`${base}?error=google_failed`);

    try {
      const code = await this.authService.startGoogleSignIn(req.user);
      return res.redirect(`${base}?code=${encodeURIComponent(code)}`);
    } catch (error) {
      this.logger.warn(
        `Google sign-in rejected: ${error instanceof Error ? error.message : String(error)}`,
      );
      const reason =
        error instanceof ConflictException
          ? 'account_conflict'
          : error instanceof UnauthorizedException
            ? 'suspended'
            : 'google_failed';
      return res.redirect(`${base}?error=${reason}`);
    }
  }

  @Public()
  @HttpCode(200)
  @Post('google/exchange')
  async googleExchange(@Body() dto: GoogleExchangeDto) {
    return this.authService.finishGoogleSignIn(dto.code);
  }
}
