import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from './strategies/jwt.strategy.js';

@Injectable()
export class IdentityService {
  constructor(private readonly jwt: JwtService) {}

  /** Issues the access token for an already-authenticated user. */
  issueToken(payload: JwtPayload): { accessToken: string } {
    return { accessToken: this.jwt.sign(payload) };
  }
}
