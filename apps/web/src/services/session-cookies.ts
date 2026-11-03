import 'server-only';

import { cookies } from 'next/headers';
import type { SessionTokens } from './identity.api.service.js';

export const SESSION_COOKIE_NAMES = {
  accessToken: 'vp_access_token',
  refreshToken: 'vp_refresh_token',
  activeOrganization: 'vp_active_tenant_id',
  twoFactorChallenge: 'vp_2fa_challenge',
} as const;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

function accessTokenMaxAge(accessToken: string): number {
  const encodedPayload = accessToken.split('.')[1];
  if (!encodedPayload) {
    throw new Error('Identity API returned an invalid access token.');
  }

  let expiration: unknown;
  try {
    const payload: unknown = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    expiration =
      typeof payload === 'object' && payload !== null && 'exp' in payload ? payload.exp : undefined;
  } catch {
    throw new Error('Identity API returned an invalid access token payload.');
  }

  if (typeof expiration !== 'number' || !Number.isInteger(expiration)) {
    throw new Error('Identity API returned an access token without an expiration.');
  }

  const maxAge = expiration - Math.floor(Date.now() / 1000);
  if (maxAge <= 0) {
    throw new Error('Identity API returned an expired access token.');
  }
  return maxAge;
}

function refreshTokenMaxAge(): number {
  const days = Number(process.env.IDENTITY_REFRESH_TTL_DAYS ?? 30);
  if (!Number.isInteger(days) || days <= 0) {
    throw new Error('IDENTITY_REFRESH_TTL_DAYS must be a positive integer.');
  }
  return days * 24 * 60 * 60;
}

export async function setSessionCookies(tokens: SessionTokens): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAMES.accessToken,
    tokens.accessToken,
    cookieOptions(accessTokenMaxAge(tokens.accessToken)),
  );
  cookieStore.set(
    SESSION_COOKIE_NAMES.refreshToken,
    tokens.refreshToken,
    cookieOptions(refreshTokenMaxAge()),
  );
}

export async function setTwoFactorChallengeCookie(challengeToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAMES.twoFactorChallenge, challengeToken, cookieOptions(5 * 60));
}

export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies();
  for (const name of Object.values(SESSION_COOKIE_NAMES)) {
    cookieStore.delete(name);
  }
}

export async function clearTwoFactorChallengeCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAMES.twoFactorChallenge);
}

export async function setActiveOrganizationCookie(tenantId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAMES.activeOrganization,
    tenantId,
    cookieOptions(refreshTokenMaxAge()),
  );
}
