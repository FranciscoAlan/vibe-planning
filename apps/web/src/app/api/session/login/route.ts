import { loginWithCredentialsSchema } from '@vibe-planners/shared-validations';
import {
  clearSessionCookies,
  setSessionCookies,
  setTwoFactorChallengeCookie,
} from '@/services/session-cookies';
import { loginWithCredentials } from '@/services/identity.api.service';
import { apiErrorResponse, readJsonBody, rejectInvalidOrigin } from '../session-route.helpers';

export async function POST(request: Request): Promise<Response> {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  const parsedBody = await readJsonBody(request);
  if ('response' in parsedBody) return parsedBody.response;

  const parsed = loginWithCredentialsSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await loginWithCredentials(parsed.data);
    await clearSessionCookies();
    if (result.twoFactorRequired) {
      await setTwoFactorChallengeCookie(result.challengeToken);
      return Response.json({ twoFactorRequired: true });
    }

    await setSessionCookies(result.tokens);
    return Response.json({ authenticated: true });
  } catch (error) {
    const response = apiErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
