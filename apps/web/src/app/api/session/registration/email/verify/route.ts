import { verifyChallengeSchema } from '@vibe-planners/shared-validations';
import { verifyEmailChallenge } from '@/services/identity.api.service';
import {
  apiErrorResponse,
  readJsonBody,
  rejectInvalidOrigin,
} from '../../../session-route.helpers';

export async function POST(request: Request): Promise<Response> {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  const parsedBody = await readJsonBody(request);
  if ('response' in parsedBody) return parsedBody.response;

  const parsed = verifyChallengeSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    return Response.json(await verifyEmailChallenge(parsed.data));
  } catch (error) {
    const response = apiErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
