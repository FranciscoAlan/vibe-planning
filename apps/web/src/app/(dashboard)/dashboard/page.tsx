import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ProviderDashboard } from '@/components/session/provider-dashboard';
import { SESSION_COOKIE_NAMES } from '@/services/session-cookies';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const hasSession =
    cookieStore.has(SESSION_COOKIE_NAMES.accessToken) ||
    cookieStore.has(SESSION_COOKIE_NAMES.refreshToken);
  if (!hasSession) redirect('/login');

  return <ProviderDashboard />;
}
