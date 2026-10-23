import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, ChallengeChannel, ChallengePurpose } from '@vibe-planners/database';
import { ChallengePurpose as SharedChallengePurpose } from '@vibe-planners/shared-types';
import * as argon2 from 'argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { IdentityService } from './identity.service.js';
import type { IdentityEmailSender } from './ports/identity-email-sender.js';

describe('IdentityService credential flows', () => {
  let service: IdentityService;
  let prismaMock: {
    user: {
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    verificationChallenge: {
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let emailSender: { sendCode: ReturnType<typeof vi.fn> };
  let jwt: { sign: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prismaMock = {
      user: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      verificationChallenge: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    prismaMock.$transaction.mockImplementation(async (operation) => operation(prismaMock));
    emailSender = { sendCode: vi.fn().mockResolvedValue(undefined) };
    jwt = { sign: vi.fn().mockReturnValue('access-token') };
    service = new IdentityService(
      prismaMock as unknown as PrismaService,
      jwt as unknown as JwtService,
      emailSender as unknown as IdentityEmailSender,
    );
  });

  it('hashes passwords and creates a pending account with an email challenge', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'user-id',
      email: 'host@example.com',
      status: AccountStatus.PENDING_VERIFICATION,
    });
    prismaMock.verificationChallenge.findFirst.mockResolvedValue(null);
    prismaMock.verificationChallenge.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.verificationChallenge.create.mockResolvedValue({ id: 'challenge-id' });

    const result = await service.register({
      email: 'host@example.com',
      phone: '+525512345678',
      password: 'correct-horse-battery',
    });

    const createCall = prismaMock.user.create.mock.calls[0][0];
    expect(await argon2.verify(createCall.data.passwordHash, 'correct-horse-battery')).toBe(true);
    expect(createCall.data.profiles.create.role).toBe('CLIENT');
    expect(result.emailVerificationChallengeId).toBe('challenge-id');
    expect(emailSender.sendCode).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'host@example.com',
        challengeId: 'challenge-id',
        purpose: SharedChallengePurpose.EMAIL_VERIFICATION,
      }),
    );
  });

  it('returns an access token for verified active credentials', async () => {
    const passwordHash = await argon2.hash('correct-horse-battery', { type: argon2.argon2id });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'host@example.com',
      passwordHash,
      status: AccountStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    });

    await expect(
      service.login({ email: 'host@example.com', password: 'correct-horse-battery' }),
    ).resolves.toEqual({ accessToken: 'access-token' });
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'user-id' });
  });

  it('rejects invalid credentials with the same response as an unknown account', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'unknown@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects expired email challenges without consuming them', async () => {
    prismaMock.verificationChallenge.findUnique.mockResolvedValue({
      id: 'challenge-id',
      userId: 'user-id',
      channel: ChallengeChannel.EMAIL,
      purpose: ChallengePurpose.EMAIL_VERIFICATION,
      secretHash: 'unused',
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      attempts: 0,
      user: { phoneVerifiedAt: null },
    });

    await expect(
      service.verifyEmail({ challengeId: 'challenge-id', code: '123456' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prismaMock.verificationChallenge.updateMany).not.toHaveBeenCalled();
  });

  it('returns the same password-reset message for an unknown email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(service.requestPasswordReset({ email: 'unknown@example.com' })).resolves.toEqual({
      message: 'If the account exists, password reset instructions will be sent.',
    });
    expect(emailSender.sendCode).not.toHaveBeenCalled();
  });
});
