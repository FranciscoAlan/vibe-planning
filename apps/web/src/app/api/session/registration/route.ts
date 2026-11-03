import { registerWithCredentialsSchema } from '@vibe-planners/shared-validations';
import { registerWithCredentials } from '@/services/identity.api.service';
import { apiErrorResponse, readJsonBody, rejectInvalidOrigin } from '../session-route.helpers';

const providerRegistrationSchema = registerWithCredentialsSchema.refine(
  ({ email, password }) => Boolean(email && password),
  { message: 'Email y contraseña son obligatorios para el registro de proveedor.' },
);

export async function POST(request: Request): Promise<Response> {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  const parsedBody = await readJsonBody(request);
  if ('response' in parsedBody) return parsedBody.response;

  const parsed = providerRegistrationSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await registerWithCredentials(parsed.data);
    return Response.json(result, { status: 201 });
  } catch (error) {
    const response = apiErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
