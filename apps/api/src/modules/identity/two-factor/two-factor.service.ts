import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';

/**
 * TOTP-based 2FA. Stub-level: generates/verifies codes but does not persist
 * secrets — wiring to `User.twoFactorSecret` happens once `identity` has a
 * real user store backing it.
 */
@Injectable()
export class TwoFactorService {
  generateSecret(
    accountLabel: string,
    issuer = 'Vibe Planners',
  ): { secret: string; otpauthUrl: string } {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(accountLabel, issuer, secret);
    return { secret, otpauthUrl };
  }

  verifyCode(secret: string, code: string): boolean {
    return authenticator.check(code, secret);
  }
}
