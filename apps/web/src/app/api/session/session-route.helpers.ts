import { IdentityApiError } from '@/services/identity.api.service';

export function rejectInvalidOrigin(request: Request): Response | undefined {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const protocol = new URL(request.url).protocol;
  const expectedOrigin = host ? `${protocol}//${host}` : null;
  if (!origin || !expectedOrigin || origin !== expectedOrigin) {
    return Response.json({ error: 'Origen de solicitud no válido.' }, { status: 403 });
  }
}

export async function readJsonBody(
  request: Request,
): Promise<{ body: unknown } | { response: Response }> {
  try {
    return { body: await request.json() };
  } catch {
    return {
      response: Response.json({ error: 'El cuerpo JSON no es válido.' }, { status: 400 }),
    };
  }
}

export function apiErrorResponse(error: unknown): Response | undefined {
  if (error instanceof IdentityApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
}
