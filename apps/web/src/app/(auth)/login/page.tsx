import { LoginForm } from '@/components/session/login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  return (
    <main lang="es" className="grid min-h-screen place-items-center px-5 py-12">
      <LoginForm sessionExpired={params.error === 'session-expired'} />
    </main>
  );
}
