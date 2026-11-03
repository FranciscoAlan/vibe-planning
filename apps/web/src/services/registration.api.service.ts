'use client';

import { ChallengePurpose } from '@vibe-planners/shared-types';
import {
  createOrganizationSchema,
  registerWithCredentialsSchema,
  requestEmailVerificationSchema,
  requestPhoneChallengeSchema,
  verifyChallengeSchema,
  verifyPhoneChallengeSchema,
  type CreateOrganizationInput,
  type RegisterWithCredentialsInput,
} from '@vibe-planners/shared-validations';

export class RegistrationApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'RegistrationApiError';
  }
}

async function requestRegistrationApi(path: string, body: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new RegistrationApiError('No fue posible conectar con el servicio de registro.', 0);
    }
    throw error;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new RegistrationApiError('El servicio de registro devolvió una respuesta inválida.', 502);
  }

  if (!response.ok) {
    const error =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? payload.error
        : undefined;
    const message =
      typeof error === 'string' ? error : 'Revisa los datos ingresados e inténtalo de nuevo.';
    throw new RegistrationApiError(message, response.status);
  }

  return payload;
}

export async function registerProviderAccount(
  input: RegisterWithCredentialsInput,
): Promise<string> {
  const payload = await requestRegistrationApi(
    '/api/session/registration',
    registerWithCredentialsSchema.parse(input),
  );
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('emailVerificationChallengeId' in payload) ||
    typeof payload.emailVerificationChallengeId !== 'string'
  ) {
    throw new RegistrationApiError('No se recibió el desafío de verificación del email.', 502);
  }
  return payload.emailVerificationChallengeId;
}

export async function resendRegistrationEmail(email: string): Promise<string> {
  const payload = await requestRegistrationApi(
    '/api/session/registration/email/request',
    requestEmailVerificationSchema.parse({ email }),
  );
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('challengeId' in payload) ||
    typeof payload.challengeId !== 'string'
  ) {
    throw new RegistrationApiError('No se recibió el desafío de verificación del email.', 502);
  }
  return payload.challengeId;
}

export async function resendRegistrationPhone(phone: string): Promise<void> {
  await requestRegistrationApi(
    '/api/session/registration/phone/request',
    requestPhoneChallengeSchema.parse({ phone, purpose: ChallengePurpose.PHONE_VERIFICATION }),
  );
}

export async function verifyRegistrationEmail(challengeId: string, code: string): Promise<void> {
  await requestRegistrationApi(
    '/api/session/registration/email/verify',
    verifyChallengeSchema.parse({ challengeId, code }),
  );
}

export async function verifyRegistrationPhone(phone: string, code: string): Promise<void> {
  await requestRegistrationApi(
    '/api/session/registration/phone/verify',
    verifyPhoneChallengeSchema.parse({
      phone,
      purpose: ChallengePurpose.PHONE_VERIFICATION,
      code,
    }),
  );
}

export async function createProviderOrganization(name: string): Promise<void> {
  await requestRegistrationApi(
    '/api/session/registration/organization',
    createOrganizationSchema.parse({ name } satisfies CreateOrganizationInput),
  );
}
