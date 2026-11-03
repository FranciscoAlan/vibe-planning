import { IdentityApiError, refreshSession, revokeSession } from '@/services/identity.api.service';
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

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SESSION_COOKIE_NAMES.accessToken)?.value;
  const refreshToken = cookieStore.get(SESSION_COOKIE_NAMES.refreshToken)?.value;
  let tokenForRevocation = accessToken;

  try {
    if (!tokenForRevocation && refreshToken) {
      const tokens = await refreshSession(refreshToken);
      await setSessionCookies(tokens);
      tokenForRevocation = tokens.accessToken;
    }

    if (tokenForRevocation) {
      try {
        await revokeSession(tokenForRevocation);
      } catch (error) {
        if (!(error instanceof IdentityApiError) || error.status !== 401 || !refreshToken) {
          throw error;
        }
        const tokens = await refreshSession(refreshToken);
        await setSessionCookies(tokens);
        await revokeSession(tokens.accessToken);
      }
    }

    await clearSessionCookies();
    return Response.json({ loggedOut: true });
  } catch (error) {
    await clearSessionCookies();
    const response = apiErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
