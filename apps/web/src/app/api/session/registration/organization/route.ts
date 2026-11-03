import { createOrganizationSchema } from '@vibe-planners/shared-validations';
import { createProviderOrganization } from '@/services/identity.api.service';
import { SESSION_COOKIE_NAMES, setActiveOrganizationCookie } from '@/services/session-cookies';
import { cookies } from 'next/headers';
import { apiErrorResponse, readJsonBody, rejectInvalidOrigin } from '../../session-route.helpers';

export async function POST(request: Request): Promise<Response> {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  const parsedBody = await readJsonBody(request);
  if ('response' in parsedBody) return parsedBody.response;

  const parsed = createOrganizationSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const accessToken = (await cookies()).get(SESSION_COOKIE_NAMES.accessToken)?.value;
  if (!accessToken) {
    return Response.json({ error: 'Inicia sesión para crear una organización.' }, { status: 401 });
  }

  try {
    const organization = await createProviderOrganization(accessToken, parsed.data);
    await setActiveOrganizationCookie(organization.id);
    return Response.json({ organization }, { status: 201 });
  } catch (error) {
    const response = apiErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
