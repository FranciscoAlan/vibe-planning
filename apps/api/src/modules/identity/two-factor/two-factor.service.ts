import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
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

  encryptSecret(secret: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv, tag, ciphertext].map((part) => part.toString('base64url')).join('.');
  }

  decryptSecret(encrypted: string): string {
    const [ivValue, tagValue, ciphertextValue, ...extra] = encrypted.split('.');
    if (!ivValue || !tagValue || !ciphertextValue || extra.length > 0) {
      throw new ServiceUnavailableException('Stored TOTP secret is invalid');
    }

    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey(),
        Buffer.from(ivValue, 'base64url'),
      );
      decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
      return Buffer.concat([
        decipher.update(Buffer.from(ciphertextValue, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new ServiceUnavailableException('Stored TOTP secret could not be decrypted');
    }
  }

  private encryptionKey(): Buffer {
    const encodedKey = process.env.IDENTITY_2FA_ENCRYPTION_KEY;
    const key = encodedKey ? Buffer.from(encodedKey, 'base64') : Buffer.alloc(0);
    if (key.length !== 32) {
      throw new ServiceUnavailableException(
        'IDENTITY_2FA_ENCRYPTION_KEY must be base64-encoded 32-byte key material',
      );
    }
    return key;
  }
}
