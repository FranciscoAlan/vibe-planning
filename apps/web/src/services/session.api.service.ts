'use client';

import type { ProviderOrganization } from './identity.api.service';

type SessionResponse = {
  authenticated?: boolean;
  twoFactorRequired?: boolean;
  refreshed?: boolean;
  loggedOut?: boolean;
  activeOrganizationId?: string | null;
  organizations?: ProviderOrganization[];
  error?: unknown;
};

export class SessionApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'SessionApiError';
  }
}

async function requestSessionApi<T extends SessionResponse>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
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
      throw new SessionApiError('No fue posible conectar con el servicio de sesión.', 0);
    }
    throw error;
  }

  let payload: SessionResponse;
  try {
    payload = (await response.json()) as SessionResponse;
  } catch {
    throw new SessionApiError('El servicio de sesión devolvió una respuesta inválida.', 502);
  }

  if (!response.ok) {
    const error = payload.error;
    const message =
      typeof error === 'string'
        ? error
        : error
          ? 'Revisa los datos ingresados e inténtalo de nuevo.'
          : 'La solicitud de sesión no pudo completarse.';
    throw new SessionApiError(message, response.status);
  }

  return payload as T;
}

export async function loginFromBrowser(input: { email: string; password: string }) {
  return requestSessionApi<{ authenticated?: boolean; twoFactorRequired?: boolean }>(
    '/api/session/login',
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export async function verifyTwoFactorFromBrowser(code: string) {
  return requestSessionApi<{ authenticated?: boolean }>('/api/session/two-factor', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function refreshFromBrowser() {
  return requestSessionApi<{ refreshed?: boolean }>('/api/session/refresh', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getOrganizationsFromBrowser() {
  return requestSessionApi<{
    organizations: ProviderOrganization[];
    activeOrganizationId: string | null;
  }>('/api/session/organizations');
}

export async function selectOrganizationFromBrowser(tenantId: string) {
  return requestSessionApi<{ activeOrganizationId: string }>('/api/session/organization', {
    method: 'POST',
    body: JSON.stringify({ tenantId }),
  });
}

export async function logoutFromBrowser() {
  return requestSessionApi<{ loggedOut?: boolean }>('/api/session/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
