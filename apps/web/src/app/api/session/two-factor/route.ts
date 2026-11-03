import { verifyTwoFactorSchema } from '@vibe-planners/shared-validations';
import { verifyTwoFactor } from '@/services/identity.api.service';
import {
  SESSION_COOKIE_NAMES,
  clearTwoFactorChallengeCookie,
  setSessionCookies,
} from '@/services/session-cookies';
import { apiErrorResponse, readJsonBody, rejectInvalidOrigin } from '../session-route.helpers';
import { cookies } from 'next/headers';

export async function POST(request: Request): Promise<Response> {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  const parsedBody = await readJsonBody(request);
  if ('response' in parsedBody) return parsedBody.response;

  const parsed = verifyTwoFactorSchema.omit({ challengeToken: true }).safeParse(parsedBody.body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const challengeToken = (await cookies()).get(SESSION_COOKIE_NAMES.twoFactorChallenge)?.value;
  if (!challengeToken) {
    return Response.json({ error: 'El desafío de autenticación expiró.' }, { status: 401 });
  }

  try {
    const tokens = await verifyTwoFactor({ ...parsed.data, challengeToken });
    await setSessionCookies(tokens);
    await clearTwoFactorChallengeCookie();
    return Response.json({ authenticated: true });
  } catch (error) {
    const response = apiErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
