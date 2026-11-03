import { refreshSession } from '@/services/identity.api.service';
import {
  clearSessionCookies,
  SESSION_COOKIE_NAMES,
  setSessionCookies,
} from '@/services/session-cookies';
import { cookies } from 'next/headers';
import { apiErrorResponse, rejectInvalidOrigin } from '../session-route.helpers';

export async function POST(request: Request): Promise<Response> {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  const refreshToken = (await cookies()).get(SESSION_COOKIE_NAMES.refreshToken)?.value;
  if (!refreshToken) {
    await clearSessionCookies();
    return Response.json({ error: 'La sesión expiró. Inicia sesión nuevamente.' }, { status: 401 });
  }

  try {
    const tokens = await refreshSession(refreshToken);
    await setSessionCookies(tokens);
    return Response.json({ refreshed: true });
  } catch (error) {
    await clearSessionCookies();
    const response = apiErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
