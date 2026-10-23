import { ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { authenticator } from 'otplib';
import { TwoFactorService } from './two-factor.service.js';

describe('TwoFactorService', () => {
  beforeEach(() => {
    process.env.IDENTITY_2FA_ENCRYPTION_KEY = Buffer.from(
      'test-key-material-32-bytes-long!',
    ).toString('base64');
  });

  it('generates a secret and verifies a code produced for it', () => {
    const service = new TwoFactorService();
    const { secret } = service.generateSecret('user@example.com');
    const code = authenticator.generate(secret);

    expect(service.verifyCode(secret, code)).toBe(true);
    expect(service.verifyCode(secret, '000000')).toBe(false);
  });

  it('encrypts TOTP secrets with authenticated encryption', () => {
    const service = new TwoFactorService();
    const encrypted = service.encryptSecret('totp-secret');

    expect(encrypted).not.toContain('totp-secret');
    expect(service.decryptSecret(encrypted)).toBe('totp-secret');
  });

  it('rejects a missing encryption key', () => {
    delete process.env.IDENTITY_2FA_ENCRYPTION_KEY;

    expect(() => new TwoFactorService().encryptSecret('totp-secret')).toThrow(
      ServiceUnavailableException,
    );
  });
});
