import { getProviderOrganizations } from '@/services/identity.api.service';
import { SESSION_COOKIE_NAMES, setActiveOrganizationCookie } from '@/services/session-cookies';
import { cookies } from 'next/headers';
import { apiErrorResponse, readJsonBody, rejectInvalidOrigin } from '../session-route.helpers';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request): Promise<Response> {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  const parsedBody = await readJsonBody(request);
  if ('response' in parsedBody) return parsedBody.response;

  const tenantId =
    typeof parsedBody.body === 'object' &&
    parsedBody.body !== null &&
    'tenantId' in parsedBody.body &&
    typeof parsedBody.body.tenantId === 'string'
      ? parsedBody.body.tenantId
      : undefined;
  if (!tenantId || !uuidPattern.test(tenantId)) {
    return Response.json(
      { error: 'El identificador de organización no es válido.' },
      { status: 400 },
    );
  }

  const accessToken = (await cookies()).get(SESSION_COOKIE_NAMES.accessToken)?.value;
  if (!accessToken) {
    return Response.json(
      { error: 'Inicia sesión para seleccionar una organización.' },
      { status: 401 },
    );
  }

  try {
    const organizations = await getProviderOrganizations(accessToken);
    if (!organizations.some((organization) => organization.id === tenantId)) {
      return Response.json(
        { error: 'No tienes acceso a la organización seleccionada.' },
        { status: 403 },
      );
    }

    await setActiveOrganizationCookie(tenantId);
    return Response.json({ activeOrganizationId: tenantId });
  } catch (error) {
    const response = apiErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
