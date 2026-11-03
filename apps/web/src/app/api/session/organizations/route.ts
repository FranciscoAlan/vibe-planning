import { getProviderOrganizations } from '@/services/identity.api.service';
import { SESSION_COOKIE_NAMES } from '@/services/session-cookies';
import { cookies } from 'next/headers';
import { apiErrorResponse } from '../session-route.helpers';

export async function GET(): Promise<Response> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SESSION_COOKIE_NAMES.accessToken)?.value;
  if (!accessToken) {
    return Response.json(
      { error: 'Inicia sesión para consultar tus organizaciones.' },
      { status: 401 },
    );
  }

  try {
    const organizations = await getProviderOrganizations(accessToken);
    const activeOrganizationId = cookieStore.get(SESSION_COOKIE_NAMES.activeOrganization)?.value;
    return Response.json({
      organizations,
      activeOrganizationId: organizations.some(({ id }) => id === activeOrganizationId)
        ? activeOrganizationId
        : null,
    });
  } catch (error) {
    const response = apiErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
