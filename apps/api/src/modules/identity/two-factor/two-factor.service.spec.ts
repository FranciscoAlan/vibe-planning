import { describe, expect, it } from 'vitest';
import { authenticator } from 'otplib';
import { TwoFactorService } from './two-factor.service.js';

describe('TwoFactorService', () => {
  it('generates a secret and verifies a code produced for it', () => {
    const service = new TwoFactorService();
    const { secret } = service.generateSecret('user@example.com');
    const code = authenticator.generate(secret);

    expect(service.verifyCode(secret, code)).toBe(true);
    expect(service.verifyCode(secret, '000000')).toBe(false);
  });
});
