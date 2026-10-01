import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';

/** Stub: real app ID/secret and callback wiring land with the `identity` feature spec. */
@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_APP_ID ?? 'placeholder',
      clientSecret: process.env.FACEBOOK_APP_SECRET ?? 'placeholder',
      callbackURL:
        process.env.FACEBOOK_CALLBACK_URL ??
        'http://localhost:3000/identity/facebook/callback',
      profileFields: ['id', 'emails', 'name'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: unknown,
  ): unknown {
    return profile;
  }
}
