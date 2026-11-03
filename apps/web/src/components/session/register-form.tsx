'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useEffect, useState, type FormEvent } from 'react';
import { Button } from '@vibe-planners/ui';
import { loginFromBrowser, SessionApiError } from '@/services/session.api.service';
import {
  createProviderOrganization,
  RegistrationApiError,
  registerProviderAccount,
  resendRegistrationEmail,
  resendRegistrationPhone,
  verifyRegistrationEmail,
  verifyRegistrationPhone,
} from '@/services/registration.api.service';

type RegistrationProgress = {
  challengeId: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

const progressKeys = {
  challengeId: 'vp_registration_email_challenge_id',
  emailVerified: 'vp_registration_email_verified',
  phoneVerified: 'vp_registration_phone_verified',
} as const;

function readProgress(): RegistrationProgress | null {
  try {
    const challengeId = sessionStorage.getItem(progressKeys.challengeId);
    if (!challengeId) return null;
    return {
      challengeId,
      emailVerified: sessionStorage.getItem(progressKeys.emailVerified) === 'true',
      phoneVerified: sessionStorage.getItem(progressKeys.phoneVerified) === 'true',
    };
  } catch {
    return null;
  }
}

function writeProgress(progress: RegistrationProgress): boolean {
  try {
    sessionStorage.setItem(progressKeys.challengeId, progress.challengeId);
    sessionStorage.setItem(progressKeys.emailVerified, String(progress.emailVerified));
    sessionStorage.setItem(progressKeys.phoneVerified, String(progress.phoneVerified));
    return true;
  } catch {
    return false;
  }
}

function clearProgress() {
  try {
    Object.values(progressKeys).forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Registration can still finish when browser storage is unavailable.
  }
}

export function RegisterForm() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [progress, setProgress] = useState<RegistrationProgress | null>(null);
  const [verificationStarted, setVerificationStarted] = useState(false);
  const [sessionEstablished, setSessionEstablished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const savedProgress = readProgress();
    if (savedProgress) {
      startTransition(() => {
        setProgress(savedProgress);
        setVerificationStarted(true);
      });
    }
  }, []);

  function saveProgress(nextProgress: RegistrationProgress) {
    setProgress(nextProgress);
    if (!writeProgress(nextProgress)) {
      setStatus('No se pudo guardar el avance en esta pestaña.');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setStatus('');
    setLoading(true);
    let organizationCreationStarted = false;

    try {
      if (!verificationStarted) {
        const challengeId = await registerProviderAccount({ email, phone, password });
        const nextProgress = { challengeId, emailVerified: false, phoneVerified: false };
        saveProgress(nextProgress);
        setVerificationStarted(true);
        setStatus('Te enviamos códigos de verificación por correo y SMS.');
        return;
      }

      if (!progress) {
        throw new RegistrationApiError('Vuelve a iniciar el registro para continuar.', 400);
      }

      let nextProgress = progress;
      if (!nextProgress.emailVerified) {
        await verifyRegistrationEmail(nextProgress.challengeId, emailCode);
        nextProgress = { ...nextProgress, emailVerified: true };
        saveProgress(nextProgress);
        setEmailCode('');
      }
      if (!nextProgress.phoneVerified) {
        await verifyRegistrationPhone(phone, phoneCode);
        nextProgress = { ...nextProgress, phoneVerified: true };
        saveProgress(nextProgress);
        setPhoneCode('');
      }

      if (!sessionEstablished) {
        const login = await loginFromBrowser({ email, password });
        if (login.twoFactorRequired) {
          throw new RegistrationApiError(
            'Completa el inicio de sesión desde la pantalla de acceso para continuar.',
            409,
          );
        }
        setSessionEstablished(true);
      }

      organizationCreationStarted = true;
      await createProviderOrganization(organizationName);
      clearProgress();
      router.replace('/dashboard');
      router.refresh();
    } catch (caught) {
      if (organizationCreationStarted) {
        clearProgress();
        router.replace('/dashboard');
        router.refresh();
        return;
      }
      setError(
        caught instanceof RegistrationApiError || caught instanceof SessionApiError
          ? caught.message
          : 'Ocurrió un error inesperado al completar el registro.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendEmail() {
    setError('');
    setStatus('');
    setLoading(true);
    try {
      const challengeId = await resendRegistrationEmail(email);
      const nextProgress = {
        challengeId,
        emailVerified: false,
        phoneVerified: progress?.phoneVerified ?? false,
      };
      saveProgress(nextProgress);
      setEmailCode('');
      setStatus('Si la cuenta puede recibir el correo, se enviará un nuevo código.');
    } catch (caught) {
      setError(
        caught instanceof RegistrationApiError
          ? caught.message
          : 'No fue posible reenviar el código por correo.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendPhone() {
    setError('');
    setStatus('');
    setLoading(true);
    try {
      await resendRegistrationPhone(phone);
      if (progress) saveProgress({ ...progress, phoneVerified: false });
      setPhoneCode('');
      setStatus('Si el teléfono puede recibir el código, se enviará un nuevo SMS.');
    } catch (caught) {
      setError(
        caught instanceof RegistrationApiError
          ? caught.message
          : 'No fue posible reenviar el código SMS.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-lg rounded-2xl border border-vibe-sand bg-white p-6 shadow-sm sm:p-8">
      <Link className="font-jakarta text-lg font-extrabold text-vibe-plum" href="/">
        Vibe Planners
      </Link>
      <h1 className="mt-8 font-jakarta text-3xl font-extrabold text-vibe-plum">
        {verificationStarted ? 'Verifica tu cuenta' : 'Crea tu cuenta de proveedor'}
      </h1>
      <p className="mt-2 text-sm leading-6 text-vibe-plum/75">
        {verificationStarted
          ? 'Ingresa los códigos recibidos por correo y SMS para continuar.'
          : 'Registra tu organización para ofrecer tus servicios en Vibe Planners.'}
      </p>

      <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-vibe-plum"
            htmlFor="organization-name"
          >
            Nombre de la organización
          </label>
          <input
            autoComplete="organization"
            className="min-h-12 w-full rounded-xl border border-vibe-sand px-4 text-vibe-plum outline-none focus-visible:ring-2 focus-visible:ring-vibe-raspberry"
            id="organization-name"
            maxLength={120}
            onChange={(event) => setOrganizationName(event.target.value)}
            required
            value={organizationName}
          />
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-vibe-plum"
            htmlFor="registration-email"
          >
            Correo electrónico
          </label>
          <input
            autoComplete="email"
            className="min-h-12 w-full rounded-xl border border-vibe-sand px-4 text-vibe-plum outline-none focus-visible:ring-2 focus-visible:ring-vibe-raspberry"
            id="registration-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-vibe-plum"
            htmlFor="registration-phone"
          >
            Teléfono en formato internacional
          </label>
          <input
            autoComplete="tel"
            className="min-h-12 w-full rounded-xl border border-vibe-sand px-4 text-vibe-plum outline-none focus-visible:ring-2 focus-visible:ring-vibe-raspberry"
            id="registration-phone"
            inputMode="tel"
            onChange={(event) => setPhone(event.target.value)}
            pattern="\+[1-9][0-9]{7,14}"
            placeholder="+525512345678"
            required
            type="tel"
            value={phone}
          />
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-vibe-plum"
            htmlFor="registration-password"
          >
            Contraseña
          </label>
          <input
            autoComplete="new-password"
            className="min-h-12 w-full rounded-xl border border-vibe-sand px-4 text-vibe-plum outline-none focus-visible:ring-2 focus-visible:ring-vibe-raspberry"
            id="registration-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        {verificationStarted && (
          <fieldset className="space-y-5 border-t border-vibe-sand pt-5">
            <legend className="px-1 text-sm font-semibold text-vibe-plum">
              Verificación de cuenta
            </legend>
            {progress?.emailVerified ? (
              <p className="text-sm font-semibold text-green-800">Correo verificado</p>
            ) : (
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-vibe-plum"
                  htmlFor="email-code"
                >
                  Código enviado por correo
                </label>
                <input
                  autoComplete="one-time-code"
                  className="min-h-12 w-full rounded-xl border border-vibe-sand px-4 text-vibe-plum outline-none focus-visible:ring-2 focus-visible:ring-vibe-raspberry"
                  id="email-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) =>
                    setEmailCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  pattern="[0-9]{6}"
                  required
                  value={emailCode}
                />
                <Button
                  className="mt-2 px-2"
                  disabled={loading}
                  onClick={handleResendEmail}
                  type="button"
                  variant="quiet"
                >
                  Reenviar código por correo
                </Button>
              </div>
            )}
            {progress?.phoneVerified ? (
              <p className="text-sm font-semibold text-green-800">Teléfono verificado</p>
            ) : (
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-vibe-plum"
                  htmlFor="phone-code"
                >
                  Código enviado por SMS
                </label>
                <input
                  autoComplete="one-time-code"
                  className="min-h-12 w-full rounded-xl border border-vibe-sand px-4 text-vibe-plum outline-none focus-visible:ring-2 focus-visible:ring-vibe-raspberry"
                  id="phone-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) =>
                    setPhoneCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  pattern="[0-9]{6}"
                  required
                  value={phoneCode}
                />
                <Button
                  className="mt-2 px-2"
                  disabled={loading}
                  onClick={handleResendPhone}
                  type="button"
                  variant="quiet"
                >
                  Reenviar código SMS
                </Button>
              </div>
            )}
          </fieldset>
        )}

        {error && (
          <p
            aria-live="polite"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        )}
        {status && (
          <p aria-live="polite" className="text-sm text-vibe-plum" role="status">
            {status}
          </p>
        )}
        <Button className="w-full" loading={loading} type="submit">
          {!verificationStarted
            ? 'Crear cuenta'
            : progress?.emailVerified && progress.phoneVerified
              ? 'Entrar y crear organización'
              : 'Verificar y continuar'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-vibe-plum/75">
        ¿Ya tienes cuenta?{' '}
        <Link className="font-semibold text-vibe-raspberry" href="/login">
          Inicia sesión
        </Link>
      </p>
      <Link className="mt-3 inline-block text-sm font-semibold text-vibe-raspberry" href="/">
        Volver al inicio
      </Link>
    </section>
  );
}
