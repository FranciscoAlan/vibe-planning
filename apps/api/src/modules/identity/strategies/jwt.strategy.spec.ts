import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  const tenantId = '00000000-0000-4000-8000-000000000001';
  const payload = { sub: 'user-id', sessionId: 'session-id' };
  let strategy: JwtStrategy;
  let prismaMock: {
    authSession: { findFirst: ReturnType<typeof vi.fn> };
    organizationMembership: {
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
    userProfile: { findUnique: ReturnType<typeof vi.fn> };
  };

  const requestWithTenant = (value?: string) =>
    ({ header: vi.fn().mockReturnValue(value) }) as unknown as Request;

  beforeEach(() => {
    prismaMock = {
      authSession: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'session-id',
          twoFactorVerified: false,
          user: { twoFactorEnabled: false },
        }),
      },
      organizationMembership: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn(),
      },
      userProfile: { findUnique: vi.fn() },
    };
    strategy = new JwtStrategy(prismaMock as unknown as PrismaService);
  });

  it('accepts an active global session without organization context', async () => {
    await expect(strategy.validate(requestWithTenant(), payload)).resolves.toEqual(payload);
    expect(prismaMock.organizationMembership.findUnique).not.toHaveBeenCalled();
  });

  it('resolves organization role from a verified membership', async () => {
    prismaMock.organizationMembership.findUnique.mockResolvedValue({ role: 'PROVIDER' });

    await expect(strategy.validate(requestWithTenant(tenantId), payload)).resolves.toEqual({
      ...payload,
      tenantId,
      role: 'PROVIDER',
    });
    expect(prismaMock.organizationMembership.findUnique).toHaveBeenCalledWith({
      where: { tenantId_userId: { tenantId, userId: payload.sub } },
      select: { role: true },
    });
  });

  it('rejects an ADMIN membership when the session did not verify TOTP', async () => {
    prismaMock.organizationMembership.findFirst.mockResolvedValue({ id: 'admin-membership' });
    prismaMock.organizationMembership.findUnique.mockResolvedValue({ role: 'ADMIN' });

    await expect(strategy.validate(requestWithTenant(tenantId), payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an ADMIN session without TOTP even when no tenant header is present', async () => {
    prismaMock.organizationMembership.findFirst.mockResolvedValue({ id: 'admin-membership' });

    await expect(strategy.validate(requestWithTenant(), payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('allows an ADMIN membership only with a TOTP-verified session', async () => {
    prismaMock.organizationMembership.findFirst.mockResolvedValue({ id: 'admin-membership' });
    prismaMock.organizationMembership.findUnique.mockResolvedValue({ role: 'ADMIN' });
    prismaMock.authSession.findFirst.mockResolvedValue({
      id: 'session-id',
      twoFactorVerified: true,
      user: { twoFactorEnabled: true },
    });

    await expect(strategy.validate(requestWithTenant(tenantId), payload)).resolves.toMatchObject({
      tenantId,
      role: 'ADMIN',
    });
  });

  it('rejects an organization context without a membership', async () => {
    prismaMock.organizationMembership.findUnique.mockResolvedValue(null);
    prismaMock.userProfile.findUnique.mockResolvedValue(null);

    await expect(strategy.validate(requestWithTenant(tenantId), payload)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows a global client profile to use tenant context for customer actions', async () => {
    prismaMock.organizationMembership.findUnique.mockResolvedValue(null);
    prismaMock.userProfile.findUnique.mockResolvedValue({ id: 'profile-id' });

    await expect(strategy.validate(requestWithTenant(tenantId), payload)).resolves.toEqual({
      ...payload,
      tenantId,
      role: 'CLIENT',
    });
    expect(prismaMock.userProfile.findUnique).toHaveBeenCalledWith({
      where: { userId_role: { userId: payload.sub, role: 'CLIENT' } },
      select: { id: true },
    });
  });

  it('rejects malformed organization context before querying memberships', async () => {
    await expect(
      strategy.validate(requestWithTenant('not-a-uuid'), payload),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaMock.organizationMembership.findUnique).not.toHaveBeenCalled();
  });

  it('rejects tokens without a live session', async () => {
    prismaMock.authSession.findFirst.mockResolvedValue(null);

    await expect(strategy.validate(requestWithTenant(), payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
