import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import googleConfig from '../config/google.config';
import type { GoogleProfile } from '../../user/google-profile';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(googleConfig.KEY)
    config: ConfigType<typeof googleConfig>,
  ) {
    super({
      // The strategy throws on empty values, so use placeholders when Google
      // sign-in isn't configured; GoogleEnabledGuard rejects the request first.
      clientID: config.clientId || 'not-configured',
      clientSecret: config.clientSecret || 'not-configured',
      callbackURL: config.callbackUrl,
      scope: ['openid', 'email', 'profile'],
    });
  }

  /** Normalises the Google profile; account resolution lives in AuthService. */
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleProfile {
    const email = profile.emails?.[0];
    if (!email?.value) {
      throw new UnauthorizedException('Google did not return an email address');
    }
    return {
      googleId: profile.id,
      email: email.value.toLowerCase(),
      // passport-google-oauth20 exposes `verified` as a boolean (or string in
      // older versions); anything other than true is treated as unverified.
      emailVerified: String(email.verified) === 'true',
      name: profile.displayName ?? '',
    };
  }
}
