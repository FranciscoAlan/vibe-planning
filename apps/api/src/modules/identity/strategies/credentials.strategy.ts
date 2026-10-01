import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

/**
 * Validates email/password credentials.
 * Stub: password hash comparison is wired once the `User` repository exists.
 */
@Injectable()
export class CredentialsStrategy extends PassportStrategy(
  Strategy,
  'credentials',
) {
  constructor() {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  validate(_email: string, _password: string): never {
    throw new UnauthorizedException('Credentials login not implemented yet');
  }
}
