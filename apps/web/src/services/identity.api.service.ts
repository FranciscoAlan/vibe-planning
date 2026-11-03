import 'server-only';

import { createHash } from 'node:crypto';
import {
  loginWithCredentialsSchema,
  verifyTwoFactorSchema,
  type LoginWithCredentialsInput,
  type VerifyTwoFactorInput,
} from '@vibe-planners/shared-validations';

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

export type ProviderOrganization = {
  id: string;
  name: string;
  role: 'OWNER' | 'PROVIDER';
};

export class IdentityApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'IdentityApiError';
  }
}

const apiBaseUrl = process.env.IDENTITY_API_BASE_URL ?? 'http://localhost:3001';
const inFlightRefreshes = new Map<string, Promise<SessionTokens>>();

function endpoint(path: string): URL {
  let baseUrl: URL;
  try {
    baseUrl = new URL(apiBaseUrl);
  } catch {
    throw new IdentityApiError('La URL de la API de identidad no es válida.', 500);
  }

  if (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') {
    throw new IdentityApiError('La URL de la API debe usar HTTP o HTTPS.', 500);
  }

  baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, '')}/`;
  return new URL(path.replace(/^\/+/, ''), baseUrl);
}

async function requestApi<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(endpoint(path), {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new IdentityApiError('No fue posible conectar con la API de identidad.', 502);
    }
    throw error;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new IdentityApiError('La API de identidad devolvió una respuesta inválida.', 502);
  }

  if (!response.ok) {
    const body = payload as { message?: unknown };
    const message = Array.isArray(body?.message)
      ? body.message.filter((item): item is string => typeof item === 'string').join(', ')
      : typeof body?.message === 'string'
        ? body.message
        : 'La solicitud de identidad no pudo completarse.';
    throw new IdentityApiError(message, response.status);
  }

  return payload as T;
}

function requireSessionTokens(payload: unknown): SessionTokens {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('accessToken' in payload) ||
    typeof payload.accessToken !== 'string' ||
    !('refreshToken' in payload) ||
    typeof payload.refreshToken !== 'string'
  ) {
    throw new IdentityApiError('La API de identidad devolvió tokens inválidos.', 502);
  }

  return { accessToken: payload.accessToken, refreshToken: payload.refreshToken };
}

export async function loginWithCredentials(input: LoginWithCredentialsInput) {
  const payload = await requestApi<unknown>('identity/login', {
    method: 'POST',
    body: JSON.stringify(loginWithCredentialsSchema.parse(input)),
  });

  if (
    typeof payload === 'object' &&
    payload !== null &&
    'twoFactorRequired' in payload &&
    payload.twoFactorRequired === true &&
    'challengeToken' in payload &&
    typeof payload.challengeToken === 'string'
  ) {
    return { twoFactorRequired: true as const, challengeToken: payload.challengeToken };
  }

  return { twoFactorRequired: false as const, tokens: requireSessionTokens(payload) };
}

export async function verifyTwoFactor(input: VerifyTwoFactorInput): Promise<SessionTokens> {
  const payload = await requestApi<unknown>('identity/2fa/verify', {
    method: 'POST',
    body: JSON.stringify(verifyTwoFactorSchema.parse(input)),
  });
  return requireSessionTokens(payload);
}

export async function refreshSession(refreshToken: string): Promise<SessionTokens> {
  const refreshKey = createHash('sha256').update(refreshToken).digest('hex');
  const inFlight = inFlightRefreshes.get(refreshKey);
  if (inFlight) return inFlight;

  const pending = requestApi<unknown>('identity/sessions/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
    .then(requireSessionTokens)
    .finally(() => {
      if (inFlightRefreshes.get(refreshKey) === pending) {
        inFlightRefreshes.delete(refreshKey);
      }
    });

  inFlightRefreshes.set(refreshKey, pending);
  return pending;
}

export async function getProviderOrganizations(
  accessToken: string,
): Promise<ProviderOrganization[]> {
  const payload = await requestApi<unknown>('identity/organizations', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (
    !Array.isArray(payload) ||
    !payload.every(
      (organization) =>
        typeof organization === 'object' &&
        organization !== null &&
        'id' in organization &&
        typeof organization.id === 'string' &&
        'name' in organization &&
        typeof organization.name === 'string' &&
        'role' in organization &&
        (organization.role === 'OWNER' || organization.role === 'PROVIDER'),
    )
  ) {
    throw new IdentityApiError('La API devolvió una lista de organizaciones inválida.', 502);
  }

  return payload;
}

export async function revokeSession(accessToken: string): Promise<void> {
  await requestApi('identity/sessions/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({}),
  });
}
