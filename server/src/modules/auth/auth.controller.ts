import { Controller, Post, Patch, Req, UseGuards, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthguard } from './guards/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { CompleteOnboardingDto } from '../user/dto/complete-onboarding.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './types/current-user';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    this.authService.signout(req.user.id);
  }

  @Patch('onboarding')
  async completeOnboarding(
    @Req() req: { user: CurrentUser },
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.authService.completeOnboarding(req.user.id, dto);
  }
}
