'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@vibe-planners/ui';
import {
  loginFromBrowser,
  SessionApiError,
  verifyTwoFactorFromBrowser,
} from '@/services/session.api.service';

export function LoginForm({ sessionExpired = false }: { sessionExpired?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (twoFactorRequired) {
        await verifyTwoFactorFromBrowser(code);
      } else {
        const result = await loginFromBrowser({ email, password });
        if (result.twoFactorRequired) {
          setTwoFactorRequired(true);
          setPassword('');
          setLoading(false);
          return;
        }
      }
      router.replace('/dashboard');
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof SessionApiError
          ? caught.message
          : 'Ocurrió un error inesperado al iniciar sesión.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-md rounded-2xl border border-vibe-sand bg-white p-6 shadow-sm sm:p-8">
      <Link className="font-jakarta text-lg font-extrabold text-vibe-plum" href="/">
        Vibe Planners
      </Link>
      <h1 className="mt-8 font-jakarta text-3xl font-extrabold text-vibe-plum">
        {twoFactorRequired ? 'Verificación en dos pasos' : 'Inicia sesión'}
      </h1>
      <p className="mt-2 text-sm leading-6 text-vibe-plum/75">
        {twoFactorRequired
          ? 'Escribe el código de seis dígitos de tu aplicación de autenticación.'
          : 'Accede a tu espacio de proveedor para continuar.'}
      </p>

      {sessionExpired && (
        <p aria-live="polite" className="mt-4 text-sm text-red-800" role="status">
          Tu sesión expiró o ya no es válida. Inicia sesión nuevamente.
        </p>
      )}

      <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
        {twoFactorRequired ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-vibe-plum" htmlFor="totp-code">
              Código de verificación
            </label>
            <input
              autoComplete="one-time-code"
              autoFocus
              className="min-h-12 w-full rounded-xl border border-vibe-sand px-4 text-vibe-plum outline-none focus-visible:ring-2 focus-visible:ring-vibe-raspberry"
              id="totp-code"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              pattern="[0-9]{6}"
              required
              value={code}
            />
          </div>
        ) : (
          <>
            <div>
              <label className="mb-2 block text-sm font-semibold text-vibe-plum" htmlFor="email">
                Correo electrónico
              </label>
              <input
                autoComplete="email"
                className="min-h-12 w-full rounded-xl border border-vibe-sand px-4 text-vibe-plum outline-none focus-visible:ring-2 focus-visible:ring-vibe-raspberry"
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-vibe-plum" htmlFor="password">
                Contraseña
              </label>
              <input
                autoComplete="current-password"
                className="min-h-12 w-full rounded-xl border border-vibe-sand px-4 text-vibe-plum outline-none focus-visible:ring-2 focus-visible:ring-vibe-raspberry"
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
          </>
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
        <Button className="w-full" loading={loading} type="submit">
          {twoFactorRequired ? 'Verificar y continuar' : 'Iniciar sesión'}
        </Button>
        {twoFactorRequired && (
          <Button
            className="w-full"
            disabled={loading}
            onClick={() => {
              setTwoFactorRequired(false);
              setCode('');
              setError('');
            }}
            type="button"
            variant="quiet"
          >
            Volver al inicio de sesión
          </Button>
        )}
      </form>

      <Link className="mt-6 inline-block text-sm font-semibold text-vibe-raspberry" href="/">
        Volver al inicio
      </Link>
      <p className="mt-4 text-sm text-vibe-plum/75">
        ¿Aún no tienes cuenta?{' '}
        <Link className="font-semibold text-vibe-raspberry" href="/register">
          Regístrate
        </Link>
      </p>
    </section>
  );
}
