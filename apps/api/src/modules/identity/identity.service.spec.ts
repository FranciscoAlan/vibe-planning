import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import { AccountStatus, ChallengeChannel, ChallengePurpose } from '@vibe-planners/database';
import {
  ChallengePurpose as SharedChallengePurpose,
  UserProfileType,
} from '@vibe-planners/shared-types';
import * as argon2 from 'argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { IdentityService } from './identity.service.js';
import type { IdentityEmailSender } from './ports/identity-email-sender.js';
import type { IdentitySmsSender } from './ports/identity-sms-sender.js';

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
    authSession: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };
    tenant: { create: ReturnType<typeof vi.fn> };
    organizationMembership: {
      create: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let emailSender: { sendCode: ReturnType<typeof vi.fn> };
  let smsSender: { sendCode: ReturnType<typeof vi.fn> };
  let jwt: { sign: ReturnType<typeof vi.fn>; verify: ReturnType<typeof vi.fn> };
  let twoFactor: {
    generateSecret: ReturnType<typeof vi.fn>;
    encryptSecret: ReturnType<typeof vi.fn>;
    decryptSecret: ReturnType<typeof vi.fn>;
    verifyCode: ReturnType<typeof vi.fn>;
  };

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
      authSession: {
        create: vi.fn().mockResolvedValue({ id: 'session-id' }),
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
      tenant: { create: vi.fn() },
      organizationMembership: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    prismaMock.$transaction.mockImplementation(async (operation) => operation(prismaMock));
    emailSender = { sendCode: vi.fn().mockResolvedValue(undefined) };
    smsSender = { sendCode: vi.fn().mockResolvedValue(undefined) };
    jwt = {
      sign: vi.fn().mockReturnValue('access-token'),
      verify: vi.fn().mockReturnValue({ sub: 'user-id', purpose: 'two_factor' }),
    };
    twoFactor = {
      generateSecret: vi
        .fn()
        .mockReturnValue({ secret: 'totp-secret', otpauthUrl: 'otpauth://test' }),
      encryptSecret: vi.fn().mockReturnValue('encrypted-totp-secret'),
      decryptSecret: vi.fn().mockReturnValue('totp-secret'),
      verifyCode: vi.fn().mockReturnValue(true),
    };
    service = new IdentityService(
      prismaMock as unknown as PrismaService,
      jwt as unknown as JwtService,
      emailSender as unknown as IdentityEmailSender,
      smsSender as unknown as IdentitySmsSender,
      twoFactor as never,
    );
  });

  it('lists only the authenticated user organizations with OWNER or PROVIDER membership', async () => {
    prismaMock.organizationMembership.findMany.mockResolvedValue([
      { role: 'OWNER', tenant: { id: 'tenant-owner', name: 'Estudio Norte' } },
      { role: 'PROVIDER', tenant: { id: 'tenant-provider', name: 'Música Viva' } },
    ]);

    await expect(service.getOrganizations('user-id')).resolves.toEqual([
      { id: 'tenant-owner', name: 'Estudio Norte', role: 'OWNER' },
      { id: 'tenant-provider', name: 'Música Viva', role: 'PROVIDER' },
    ]);
    expect(prismaMock.organizationMembership.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        role: { in: ['OWNER', 'PROVIDER'] },
      },
      select: {
        role: true,
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
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
    expect(smsSender.sendCode).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+525512345678', code: expect.stringMatching(/^\d{6}$/) }),
    );
  });

  it('registers a phone-only account without creating an email challenge', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'user-id',
      email: null,
      status: AccountStatus.PENDING_VERIFICATION,
    });
    prismaMock.verificationChallenge.findFirst.mockResolvedValue(null);
    prismaMock.verificationChallenge.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.verificationChallenge.create.mockResolvedValue({ id: 'phone-challenge-id' });

    const result = await service.register({
      phone: '+525512345678',
      profile: UserProfileType.CLIENT,
    });

    expect(result.phoneVerificationChallengeId).toBe('phone-challenge-id');
    expect(result).not.toHaveProperty('emailVerificationChallengeId');
    expect(emailSender.sendCode).not.toHaveBeenCalled();
    expect(smsSender.sendCode).toHaveBeenCalledOnce();
  });

  it('sends a generic phone-login challenge only for an active verified account', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-id',
      phoneVerifiedAt: new Date(),
      status: AccountStatus.ACTIVE,
    });
    prismaMock.verificationChallenge.findFirst.mockResolvedValue(null);
    prismaMock.verificationChallenge.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.verificationChallenge.create.mockResolvedValue({ id: 'challenge-id' });

    await expect(
      service.requestPhoneChallenge({
        phone: '+525512345678',
        purpose: SharedChallengePurpose.PHONE_LOGIN,
      }),
    ).resolves.toEqual({
      message: 'If the account can receive a verification code, one will be sent.',
    });
    expect(smsSender.sendCode).toHaveBeenCalledOnce();
  });

  it('returns the email verification challenge id with a generic response', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-id', emailVerifiedAt: null });
    prismaMock.verificationChallenge.findFirst.mockResolvedValue(null);
    prismaMock.verificationChallenge.create.mockResolvedValue({ id: 'email-challenge-id' });

    await expect(service.requestEmailVerification({ email: 'host@example.com' })).resolves.toEqual({
      message: 'If the account can receive a verification email, one will be sent.',
      challengeId: 'email-challenge-id',
    });
    expect(emailSender.sendCode).toHaveBeenCalledWith(
      expect.objectContaining({ challengeId: 'email-challenge-id' }),
    );
  });

  it('returns an unusable email challenge id when no eligible account exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.verificationChallenge.findFirst.mockResolvedValue(null);

    const result = await service.requestEmailVerification({ email: 'unknown@example.com' });

    expect(result).toEqual({
      message: 'If the account can receive a verification email, one will be sent.',
      challengeId: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
    });
    await expect(
      service.verifyEmail({ challengeId: result.challengeId, code: '123456' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(emailSender.sendCode).not.toHaveBeenCalled();
  });

  it('does not expose a failed email challenge id when delivery fails', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-id', emailVerifiedAt: null });
    prismaMock.verificationChallenge.findFirst.mockResolvedValue(null);
    prismaMock.verificationChallenge.create.mockResolvedValue({ id: 'unsent-challenge-id' });
    prismaMock.verificationChallenge.updateMany.mockResolvedValue({ count: 1 });
    emailSender.sendCode.mockRejectedValue(new Error('email provider unavailable'));

    const result = await service.requestEmailVerification({ email: 'host@example.com' });

    expect(result.challengeId).not.toBe('unsent-challenge-id');
    expect(result.challengeId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(prismaMock.verificationChallenge.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'unsent-challenge-id', consumedAt: null },
        data: { consumedAt: expect.any(Date) },
      }),
    );
  });

  it('verifies a phone-login challenge and issues an identity-only access token', async () => {
    const code = '012345';
    const user = {
      id: 'user-id',
      email: null,
      emailVerifiedAt: null,
      phoneVerifiedAt: new Date(),
      status: AccountStatus.ACTIVE,
    };
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.verificationChallenge.findFirst.mockResolvedValue({
      id: 'challenge-id',
      userId: user.id,
      channel: ChallengeChannel.SMS,
      purpose: ChallengePurpose.PHONE_LOGIN,
      secretHash: await argon2.hash(code, { type: argon2.argon2id }),
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      user,
    });
    prismaMock.verificationChallenge.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.verifyPhoneChallenge({
        phone: '+525512345678',
        purpose: SharedChallengePurpose.PHONE_LOGIN,
        code,
      }),
    ).resolves.toEqual({ accessToken: 'access-token', refreshToken: expect.any(String) });
    expect(jwt.sign).toHaveBeenCalledWith({
      sub: user.id,
      sessionId: 'session-id',
      twoFactorVerified: false,
    });
  });

  it('consumes a valid phone challenge and rejects replay', async () => {
    const code = '654321';
    const user = {
      id: 'user-id',
      email: null,
      emailVerifiedAt: null,
      phoneVerifiedAt: new Date(),
      status: AccountStatus.ACTIVE,
    };
    const challenge = {
      id: 'challenge-id',
      userId: user.id,
      channel: ChallengeChannel.SMS,
      purpose: ChallengePurpose.PHONE_LOGIN,
      secretHash: await argon2.hash(code, { type: argon2.argon2id }),
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null as Date | null,
      user,
    };
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.verificationChallenge.findFirst.mockResolvedValue(challenge);
    prismaMock.verificationChallenge.updateMany.mockImplementation(async ({ data }) => {
      if (data.consumedAt) {
        challenge.consumedAt = data.consumedAt;
      }
      return { count: 1 };
    });

    const input = {
      phone: '+525512345678',
      purpose: SharedChallengePurpose.PHONE_LOGIN,
      code,
    };
    await expect(service.verifyPhoneChallenge(input)).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: expect.any(String),
    });
    await expect(service.verifyPhoneChallenge(input)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.sign).toHaveBeenCalledOnce();
  });

  it('increments the attempt count after an incorrect phone code', async () => {
    const user = {
      id: 'user-id',
      email: null,
      emailVerifiedAt: null,
      phoneVerifiedAt: new Date(),
      status: AccountStatus.ACTIVE,
    };
    prismaMock.user.findUnique.mockResolvedValue(user);
    prismaMock.verificationChallenge.findFirst.mockResolvedValue({
      id: 'challenge-id',
      userId: user.id,
      channel: ChallengeChannel.SMS,
      purpose: ChallengePurpose.PHONE_LOGIN,
      secretHash: await argon2.hash('123456', { type: argon2.argon2id }),
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      user,
    });
    prismaMock.verificationChallenge.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.verifyPhoneChallenge({
        phone: '+525512345678',
        purpose: SharedChallengePurpose.PHONE_LOGIN,
        code: '000000',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prismaMock.verificationChallenge.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { attempts: { increment: 1 } } }),
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

    const result = await service.login({
      email: 'host@example.com',
      password: 'correct-horse-battery',
    });
    expect(result).toEqual({ accessToken: 'access-token', refreshToken: expect.any(String) });
    expect(jwt.sign).toHaveBeenCalledWith({
      sub: 'user-id',
      sessionId: 'session-id',
      twoFactorVerified: false,
    });
    const sessionData = prismaMock.authSession.create.mock.calls[0][0].data;
    expect(sessionData.tokenHash).toBe(
      createHash('sha256').update(result.refreshToken).digest('hex'),
    );
    expect(sessionData.tokenHash).not.toBe(result.refreshToken);
  });

  it('rotates refresh tokens and persists only the replacement hash', async () => {
    const refreshToken = 'old-refresh-token-which-is-long-enough-to-be-valid';
    const familyId = 'family-id';
    const sessionId = 'session-id';
    prismaMock.authSession.findUnique.mockResolvedValue({
      id: sessionId,
      userId: 'user-id',
      familyId,
      revokedAt: null,
      twoFactorVerified: true,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prismaMock.authSession.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.authSession.create.mockResolvedValue({ id: 'replacement-session-id' });

    const result = await service.refreshSession({ refreshToken });
    const createData = prismaMock.authSession.create.mock.calls[0][0].data;

    expect(result).toEqual({ accessToken: 'access-token', refreshToken: expect.any(String) });
    expect(prismaMock.authSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: sessionId, revokedAt: null }),
      }),
    );
    expect(createData.familyId).toBe(familyId);
    expect(createData.tokenHash).toBe(
      createHash('sha256').update(result.refreshToken).digest('hex'),
    );
    expect(createData.tokenHash).not.toBe(result.refreshToken);
    expect(createData.twoFactorVerified).toBe(true);
    expect(jwt.sign).toHaveBeenCalledWith({
      sub: 'user-id',
      sessionId: 'replacement-session-id',
      twoFactorVerified: true,
    });
  });

  it('revokes the active session family when a rotated refresh token is reused', async () => {
    const familyId = 'family-id';
    prismaMock.authSession.findUnique.mockResolvedValue({
      id: 'old-session-id',
      userId: 'user-id',
      familyId,
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });
    prismaMock.authSession.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.refreshSession({
        refreshToken: 'old-refresh-token-which-is-long-enough-to-be-valid',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prismaMock.authSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { familyId, revokedAt: null } }),
    );
  });

  it('revokes the current session and all sessions for logout operations', async () => {
    prismaMock.authSession.updateMany.mockResolvedValue({ count: 3 });

    await expect(service.logout('user-id', 'session-id')).resolves.toEqual({ loggedOut: true });
    await expect(service.logoutAll('user-id')).resolves.toEqual({ revokedSessions: 3 });
    expect(prismaMock.authSession.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { id: 'session-id', userId: 'user-id', revokedAt: null } }),
    );
    expect(prismaMock.authSession.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { userId: 'user-id', revokedAt: null } }),
    );
  });

  it('creates an organization and OWNER membership in one transaction', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ status: AccountStatus.ACTIVE });
    prismaMock.tenant.create.mockResolvedValue({ id: 'tenant-id', name: 'Studio Norte' });
    prismaMock.organizationMembership.create.mockResolvedValue({
      id: 'membership-id',
      tenantId: 'tenant-id',
      userId: 'user-id',
      role: 'OWNER',
    });

    await expect(service.createOrganization('user-id', { name: 'Studio Norte' })).resolves.toEqual({
      organization: { id: 'tenant-id', name: 'Studio Norte' },
      membership: {
        id: 'membership-id',
        tenantId: 'tenant-id',
        userId: 'user-id',
        role: 'OWNER',
      },
    });
    expect(prismaMock.organizationMembership.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { tenantId: 'tenant-id', userId: 'user-id', role: 'OWNER' },
      }),
    );
  });

  it('stores an encrypted TOTP secret and enables it only after code verification', async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce({
        id: 'user-id',
        email: 'host@example.com',
        phone: '+525512345678',
        twoFactorEnabled: false,
      })
      .mockResolvedValueOnce({ twoFactorSecret: 'encrypted-totp-secret', twoFactorEnabled: false });
    prismaMock.user.update.mockResolvedValue({});

    await expect(service.beginTwoFactorEnrollment('user-id')).resolves.toEqual({
      secret: 'totp-secret',
      otpauthUrl: 'otpauth://test',
    });
    expect(prismaMock.user.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: { twoFactorSecret: 'encrypted-totp-secret', twoFactorEnabled: false },
      }),
    );

    await expect(service.confirmTwoFactorEnrollment('user-id', '123456')).resolves.toEqual({
      twoFactorEnabled: true,
    });
    expect(twoFactor.decryptSecret).toHaveBeenCalledWith('encrypted-totp-secret');
    expect(prismaMock.user.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ data: { twoFactorEnabled: true } }),
    );
  });

  it('requires TOTP before creating a session for an ADMIN login', async () => {
    const passwordHash = await argon2.hash('correct-horse-battery', { type: argon2.argon2id });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'admin-id',
      email: 'admin@example.com',
      passwordHash,
      status: AccountStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      twoFactorEnabled: true,
      twoFactorSecret: 'encrypted-totp-secret',
    });
    prismaMock.organizationMembership.findFirst.mockResolvedValue({ id: 'admin-membership' });

    await expect(
      service.login({ email: 'admin@example.com', password: 'correct-horse-battery' }),
    ).resolves.toEqual({ twoFactorRequired: true, challengeToken: 'access-token' });
    expect(jwt.sign).toHaveBeenCalledWith(
      { sub: 'admin-id', purpose: 'two_factor' },
      { expiresIn: '5m' },
    );
    expect(prismaMock.authSession.create).not.toHaveBeenCalled();
  });

  it('issues an MFA-verified session only after validating the challenge and TOTP code', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'admin-id',
      status: AccountStatus.ACTIVE,
      twoFactorEnabled: true,
      twoFactorSecret: 'encrypted-totp-secret',
    });

    await expect(
      service.verifyTwoFactor({ challengeToken: 'two-factor-challenge', code: '123456' }),
    ).resolves.toEqual({ accessToken: 'access-token', refreshToken: expect.any(String) });
    expect(jwt.verify).toHaveBeenCalledWith('two-factor-challenge');
    expect(twoFactor.verifyCode).toHaveBeenCalledWith('totp-secret', '123456');
    expect(prismaMock.authSession.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ twoFactorVerified: true }) }),
    );
  });

  it('rejects an ADMIN login if TOTP was not enrolled before promotion', async () => {
    const passwordHash = await argon2.hash('correct-horse-battery', { type: argon2.argon2id });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'admin-id',
      email: 'admin@example.com',
      passwordHash,
      status: AccountStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
    prismaMock.organizationMembership.findFirst.mockResolvedValue({ id: 'admin-membership' });

    await expect(
      service.login({ email: 'admin@example.com', password: 'correct-horse-battery' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prismaMock.authSession.create).not.toHaveBeenCalled();
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
