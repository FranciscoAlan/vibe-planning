import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { DirectoryModule } from '../src/modules/directory/directory.module.js';
import { IdentityModule } from '../src/modules/identity/identity.module.js';
import { IDENTITY_EMAIL_SENDER } from '../src/modules/identity/ports/identity-email-sender.js';
import type { IdentityEmailSender } from '../src/modules/identity/ports/identity-email-sender.js';
import { IDENTITY_SMS_SENDER } from '../src/modules/identity/ports/identity-sms-sender.js';
import type { IdentitySmsSender } from '../src/modules/identity/ports/identity-sms-sender.js';

type Row = Record<string, unknown>;

type MemoryState = {
  users: Row[];
  profiles: Row[];
  challenges: Row[];
  sessions: Row[];
  tenants: Row[];
  memberships: Row[];
  listings: Row[];
};

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([field, expected]) => {
    if (field === 'OR') {
      return Array.isArray(expected) && expected.some((clause) => matches(row, clause as Row));
    }
    if (field === 'AND') {
      return Array.isArray(expected) && expected.every((clause) => matches(row, clause as Row));
    }
    if (field === 'tenantId_userId' || field === 'userId_role') {
      return matches(row, expected as Row);
    }

    const actual = row[field];
    if (expected instanceof Date) {
      return actual instanceof Date && actual.getTime() === expected.getTime();
    }
    if (expected && typeof expected === 'object') {
      return Object.entries(expected).every(([operator, value]) => {
        const actualDate = actual instanceof Date ? actual.getTime() : actual;
        const expectedDate = value instanceof Date ? value.getTime() : value;
        if (operator === 'in') return Array.isArray(value) && value.includes(actual);
        if (operator === 'gt') return actualDate > (expectedDate as number);
        if (operator === 'gte') return actualDate >= (expectedDate as number);
        if (operator === 'lt') return actualDate < (expectedDate as number);
        if (operator === 'lte') return actualDate <= (expectedDate as number);
        return false;
      });
    }
    return actual === expected;
  });
}

function createMemoryPrisma() {
  const state: MemoryState = {
    users: [],
    profiles: [],
    challenges: [],
    sessions: [],
    tenants: [],
    memberships: [],
    listings: [],
  };
  let nextId = 1;
  const newId = () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`;
  const prisma: Record<string, unknown> = {};

  const userDelegate = {
    findFirst: vi.fn(
      async ({ where }: { where: Row }) => state.users.find((user) => matches(user, where)) ?? null,
    ),
    findUnique: vi.fn(
      async ({ where }: { where: Row }) => state.users.find((user) => matches(user, where)) ?? null,
    ),
    create: vi.fn(async ({ data }: { data: Row }) => {
      const profileData = data.profiles as { create?: Row } | undefined;
      const user: Row = {
        id: newId(),
        email: null,
        emailVerifiedAt: null,
        phone: null,
        phoneVerifiedAt: null,
        passwordHash: null,
        status: 'PENDING_VERIFICATION',
        twoFactorSecret: null,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      delete user.profiles;
      state.users.push(user);
      if (profileData?.create) {
        state.profiles.push({ id: newId(), userId: user.id, ...profileData.create });
      }
      return user;
    }),
    update: vi.fn(async ({ where, data }: { where: Row; data: Row }) => {
      const user = state.users.find((candidate) => matches(candidate, where));
      if (!user) throw new Error('User not found in identity e2e mock');
      Object.assign(user, data, { updatedAt: new Date() });
      return user;
    }),
  };

  const challengeDelegate = {
    findFirst: vi.fn(async ({ where, include }: { where: Row; include?: Row }) => {
      const challenge = [...state.challenges]
        .reverse()
        .find((candidate) => matches(candidate, where));
      if (!challenge) return null;
      if (include?.user) {
        return {
          ...challenge,
          user: state.users.find((user) => user.id === challenge.userId),
        };
      }
      return challenge;
    }),
    findUnique: vi.fn(
      async ({ where }: { where: Row }) =>
        state.challenges.find((challenge) => matches(challenge, where)) ?? null,
    ),
    create: vi.fn(async ({ data }: { data: Row }) => {
      const challenge = {
        id: newId(),
        attempts: 0,
        consumedAt: null,
        createdAt: new Date(),
        ...data,
      };
      state.challenges.push(challenge);
      return challenge;
    }),
    updateMany: vi.fn(async ({ where, data }: { where: Row; data: Row }) => {
      const selected = state.challenges.filter((challenge) => matches(challenge, where));
      for (const challenge of selected) {
        for (const [field, value] of Object.entries(data)) {
          if (value && typeof value === 'object' && 'increment' in value) {
            challenge[field] = Number(challenge[field] ?? 0) + Number(value.increment);
          } else {
            challenge[field] = value;
          }
        }
      }
      return { count: selected.length };
    }),
  };

  const sessionDelegate = {
    findUnique: vi.fn(
      async ({ where }: { where: Row }) =>
        state.sessions.find((session) => matches(session, where)) ?? null,
    ),
    findFirst: vi.fn(async ({ where }: { where: Row }) => {
      const session = state.sessions.find((candidate) => matches(candidate, where));
      if (!session) return null;
      return {
        ...session,
        user: state.users.find((user) => user.id === session.userId),
      };
    }),
    create: vi.fn(async ({ data }: { data: Row }) => {
      const session = {
        id: newId(),
        twoFactorVerified: false,
        revokedAt: null,
        lastUsedAt: null,
        createdAt: new Date(),
        ...data,
      };
      state.sessions.push(session);
      return session;
    }),
    updateMany: vi.fn(async ({ where, data }: { where: Row; data: Row }) => {
      const selected = state.sessions.filter((session) => matches(session, where));
      selected.forEach((session) => Object.assign(session, data));
      return { count: selected.length };
    }),
  };

  const membershipDelegate = {
    findMany: vi.fn(async ({ where, select }: { where: Row; select?: Row }) =>
      state.memberships
        .filter((membership) => matches(membership, where))
        .map((membership) => {
          if (select?.tenant) {
            const tenant = state.tenants.find((candidate) => candidate.id === membership.tenantId);
            return { role: membership.role, tenant };
          }
          return membership;
        }),
    ),
    findFirst: vi.fn(
      async ({ where }: { where: Row }) =>
        state.memberships.find((membership) => matches(membership, where)) ?? null,
    ),
    findUnique: vi.fn(
      async ({ where }: { where: Row }) =>
        state.memberships.find((membership) => matches(membership, where.tenantId_userId as Row)) ??
        null,
    ),
    create: vi.fn(async ({ data }: { data: Row }) => {
      const membership = { id: newId(), createdAt: new Date(), ...data };
      state.memberships.push(membership);
      return membership;
    }),
  };

  Object.assign(prisma, {
    user: userDelegate,
    verificationChallenge: challengeDelegate,
    authSession: sessionDelegate,
    tenant: {
      create: vi.fn(async ({ data }: { data: Row }) => {
        const tenant = { id: newId(), createdAt: new Date(), updatedAt: new Date(), ...data };
        state.tenants.push(tenant);
        return tenant;
      }),
    },
    organizationMembership: membershipDelegate,
    userProfile: {
      findUnique: vi.fn(
        async ({ where }: { where: Row }) =>
          state.profiles.find((profile) => matches(profile, where.userId_role as Row)) ?? null,
      ),
    },
    listing: {
      findFirst: vi.fn(
        async ({ where }: { where: Row }) =>
          state.listings.find((listing) => matches(listing, where)) ?? null,
      ),
      create: vi.fn(async ({ data }: { data: Row }) => {
        const listing = { id: newId(), status: 'DRAFT', ...data };
        state.listings.push(listing);
        return listing;
      }),
    },
    $transaction: vi.fn(async (callback: (transaction: unknown) => Promise<unknown>) =>
      callback(prisma),
    ),
  });

  return { prisma, state };
}

describe('Identity flows (e2e)', () => {
  let app: INestApplication<App> | undefined;
  let state: MemoryState;
  let emailMessages: Parameters<IdentityEmailSender['sendCode']>[0][];
  let smsMessages: Parameters<IdentitySmsSender['sendCode']>[0][];

  beforeEach(async () => {
    process.env.IDENTITY_2FA_ENCRYPTION_KEY = Buffer.from(
      'test-key-material-32-bytes-long!',
    ).toString('base64');
    const memory = createMemoryPrisma();
    state = memory.state;
    emailMessages = [];
    smsMessages = [];
    const emailSender: IdentityEmailSender = {
      sendCode: vi.fn(async (message) => {
        emailMessages.push(message);
      }),
    };
    const smsSender: IdentitySmsSender = {
      sendCode: vi.fn(async (message) => {
        smsMessages.push(message);
      }),
    };

    const moduleFixture = await Test.createTestingModule({
      imports: [IdentityModule, DirectoryModule],
    })
      .overrideProvider(PrismaService)
      .useValue(memory.prisma)
      .overrideProvider(IDENTITY_EMAIL_SENDER)
      .useValue(emailSender)
      .overrideProvider(IDENTITY_SMS_SENDER)
      .useValue(smsSender)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('requires authentication and returns only the current user eligible organizations', async () => {
    state.users.push(
      { id: 'user-a', twoFactorEnabled: true },
      { id: 'user-b', twoFactorEnabled: false },
    );
    state.tenants.push(
      { id: 'tenant-a-owner', name: 'Estudio Norte' },
      { id: 'tenant-a-admin', name: 'Administración Norte' },
      { id: 'tenant-b-provider', name: 'Música Viva' },
    );
    state.memberships.push(
      { userId: 'user-a', tenantId: 'tenant-a-owner', role: 'OWNER' },
      { userId: 'user-a', tenantId: 'tenant-a-admin', role: 'ADMIN' },
      { userId: 'user-b', tenantId: 'tenant-b-provider', role: 'PROVIDER' },
    );
    state.sessions.push(
      {
        id: 'session-a',
        userId: 'user-a',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        twoFactorVerified: true,
      },
      {
        id: 'session-b',
        userId: 'user-b',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        twoFactorVerified: false,
      },
    );

    const jwt = app!.get(JwtService);
    const tokenA = jwt.sign({ sub: 'user-a', sessionId: 'session-a' });
    const tokenB = jwt.sign({ sub: 'user-b', sessionId: 'session-b' });
    const http = request(app!.getHttpServer());

    await http.get('/identity/organizations').expect(401);
    await http
      .get('/identity/organizations')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200)
      .expect([{ id: 'tenant-a-owner', name: 'Estudio Norte', role: 'OWNER' }]);
    await http
      .get('/identity/organizations')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200)
      .expect([{ id: 'tenant-b-provider', name: 'Música Viva', role: 'PROVIDER' }]);
  });

  it('returns the same generic email verification response shape for eligible and unknown emails', async () => {
    await request(app!.getHttpServer())
      .post('/identity/register')
      .send({
        email: 'host@example.com',
        phone: '+525512345678',
        password: 'initial-password',
      })
      .expect(201);

    const eligible = await request(app!.getHttpServer())
      .post('/identity/email/verification/request')
      .send({ email: 'host@example.com' })
      .expect(200);
    const unknown = await request(app!.getHttpServer())
      .post('/identity/email/verification/request')
      .send({ email: 'unknown@example.com' })
      .expect(200);

    expect(eligible.body.message).toBe(
      'If the account can receive a verification email, one will be sent.',
    );
    expect(unknown.body.message).toBe(eligible.body.message);
    expect(Object.keys(unknown.body).sort()).toEqual(Object.keys(eligible.body).sort());
    expect(eligible.body.challengeId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(unknown.body.challengeId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    await request(app!.getHttpServer())
      .post('/identity/email/verification/confirm')
      .send({ challengeId: unknown.body.challengeId, code: '123456' })
      .expect(401);
  });

  it('registers, verifies, recovers credentials, creates an organization and enforces admin TOTP', async () => {
    const registration = await request(app!.getHttpServer())
      .post('/identity/register')
      .send({
        email: 'host@example.com',
        phone: '+525512345678',
        password: 'initial-password',
      })
      .expect(201);
    const userId = registration.body.user.id as string;
    expect(registration.body.user.status).toBe('pending_verification');
    expect(emailMessages).toHaveLength(1);
    expect(smsMessages).toHaveLength(1);

    await request(app!.getHttpServer())
      .post('/identity/phone/verify')
      .send({
        phone: '+525512345678',
        purpose: 'phone_verification',
        code: smsMessages[0].code,
      })
      .expect(200)
      .expect(({ body }) => expect(body.status).toBe('PENDING_VERIFICATION'));

    await request(app!.getHttpServer())
      .post('/identity/email/verification/confirm')
      .send({
        challengeId: registration.body.emailVerificationChallengeId,
        code: emailMessages[0].code,
      })
      .expect(200)
      .expect({ emailVerified: true });
    expect(state.users[0].status).toBe('ACTIVE');

    await request(app!.getHttpServer())
      .post('/identity/password/forgot')
      .send({ email: 'host@example.com' })
      .expect(200)
      .expect({ message: 'If the account exists, password reset instructions will be sent.' });
    const resetMessage = emailMessages[1];
    await request(app!.getHttpServer())
      .post('/identity/password/reset')
      .send({
        challengeId: resetMessage.challengeId,
        code: resetMessage.code,
        newPassword: 'recovered-password',
      })
      .expect(200)
      .expect({ passwordReset: true });

    const login = await request(app!.getHttpServer())
      .post('/identity/login')
      .send({ email: 'host@example.com', password: 'recovered-password' })
      .expect(200);
    const rotated = await request(app!.getHttpServer())
      .post('/identity/sessions/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);
    expect(rotated.body.refreshToken).not.toBe(login.body.refreshToken);
    expect(state.sessions[0].revokedAt).toBeInstanceOf(Date);

    await request(app!.getHttpServer())
      .post('/identity/password/change')
      .set('Authorization', `Bearer ${rotated.body.accessToken}`)
      .send({ currentPassword: 'recovered-password', newPassword: 'final-password' })
      .expect(200)
      .expect({ passwordChanged: true });

    const organizationResponse = await request(app!.getHttpServer())
      .post('/identity/organizations')
      .set('Authorization', `Bearer ${rotated.body.accessToken}`)
      .send({ name: 'Estudio Violeta' })
      .expect(201);
    const organizationId = organizationResponse.body.organization.id as string;
    const membership = state.memberships[0];
    expect(membership).toMatchObject({ tenantId: organizationId, userId, role: 'OWNER' });

    const enrollment = await request(app!.getHttpServer())
      .post('/identity/2fa/enroll')
      .set('Authorization', `Bearer ${rotated.body.accessToken}`)
      .expect(200);
    const secret = enrollment.body.secret as string;
    expect(state.users[0].twoFactorSecret).not.toBe(secret);
    expect(state.users[0].twoFactorEnabled).toBe(false);
    await request(app!.getHttpServer())
      .post('/identity/2fa/enroll/confirm')
      .set('Authorization', `Bearer ${rotated.body.accessToken}`)
      .send({ code: authenticator.generate(secret) })
      .expect(200)
      .expect({ twoFactorEnabled: true });

    const listingInput = {
      categoryId: '00000000-0000-4000-8000-000000000101',
      subcategoryId: '00000000-0000-4000-8000-000000000102',
      title: 'Jardín de celebraciones',
      description: 'Un espacio amplio para celebraciones y reuniones familiares.',
      city: 'Puebla',
      state: 'Puebla',
      basePrice: 25000,
    };
    await request(app!.getHttpServer())
      .post('/directory/listings')
      .set('Authorization', `Bearer ${rotated.body.accessToken}`)
      .set('x-tenant-id', '00000000-0000-4000-8000-000000000999')
      .send(listingInput)
      .expect(403);

    await request(app!.getHttpServer())
      .post('/directory/listings')
      .set('Authorization', `Bearer ${rotated.body.accessToken}`)
      .set('x-tenant-id', organizationId)
      .send(listingInput)
      .expect(201)
      .expect(({ body }) => expect(body.ownerId).toBe(userId));

    membership.role = 'ADMIN';
    await request(app!.getHttpServer())
      .post('/identity/sessions/logout-all')
      .set('Authorization', `Bearer ${rotated.body.accessToken}`)
      .set('x-tenant-id', organizationId)
      .expect(401);

    const adminLogin = await request(app!.getHttpServer())
      .post('/identity/login')
      .send({ email: 'host@example.com', password: 'final-password' })
      .expect(200);
    expect(adminLogin.body).toMatchObject({ twoFactorRequired: true });
    expect(adminLogin.body).not.toHaveProperty('refreshToken');

    const adminSession = await request(app!.getHttpServer())
      .post('/identity/2fa/verify')
      .send({
        challengeToken: adminLogin.body.challengeToken,
        code: authenticator.generate(secret),
      })
      .expect(200);
    expect(state.sessions.at(-1)?.twoFactorVerified).toBe(true);

    await request(app!.getHttpServer())
      .post('/identity/sessions/logout')
      .set('Authorization', `Bearer ${adminSession.body.accessToken}`)
      .set('x-tenant-id', organizationId)
      .expect(200)
      .expect({ loggedOut: true });
    await request(app!.getHttpServer())
      .post('/identity/sessions/logout')
      .set('Authorization', `Bearer ${adminSession.body.accessToken}`)
      .expect(401);
  });

  it('supports phone-only registration and phone OTP login with logout', async () => {
    const registration = await request(app!.getHttpServer())
      .post('/identity/register')
      .send({ phone: '+525576543210' })
      .expect(201);
    expect(registration.body.user.email).toBeNull();

    await request(app!.getHttpServer())
      .post('/identity/phone/verify')
      .send({
        phone: '+525576543210',
        purpose: 'phone_verification',
        code: smsMessages[0].code,
      })
      .expect(200)
      .expect(({ body }) => expect(body.status).toBe('ACTIVE'));

    await request(app!.getHttpServer())
      .post('/identity/phone/challenge')
      .send({ phone: '+525576543210', purpose: 'phone_login' })
      .expect(200);
    const login = await request(app!.getHttpServer())
      .post('/identity/phone/verify')
      .send({
        phone: '+525576543210',
        purpose: 'phone_login',
        code: smsMessages[1].code,
      })
      .expect(200);

    await request(app!.getHttpServer())
      .post('/identity/sessions/logout')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200)
      .expect({ loggedOut: true });
    await request(app!.getHttpServer())
      .post('/identity/sessions/logout-all')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(401);
  });
});
