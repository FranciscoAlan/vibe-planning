'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@vibe-planners/ui';
import type { ProviderOrganization } from '@/services/identity.api.service';
import {
  getOrganizationsFromBrowser,
  logoutFromBrowser,
  refreshFromBrowser,
  selectOrganizationFromBrowser,
  SessionApiError,
} from '@/services/session.api.service';

type DashboardState =
  | { status: 'loading' }
  | { status: 'ready'; organizations: ProviderOrganization[]; activeOrganizationId: string | null }
  | { status: 'empty' }
  | { status: 'error'; message: string };

export function ProviderDashboard() {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>({ status: 'loading' });
  const [selectionBusy, setSelectionBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const initialLoadStarted = useRef(false);

  const loadOrganizations = useCallback(async () => {
    try {
      let result: Awaited<ReturnType<typeof getOrganizationsFromBrowser>>;
      try {
        result = await getOrganizationsFromBrowser();
      } catch (error) {
        if (!(error instanceof SessionApiError) || error.status !== 401) throw error;
        await refreshFromBrowser();
        result = await getOrganizationsFromBrowser();
      }

      if (result.organizations.length === 0) {
        setState({ status: 'empty' });
        return;
      }

      let activeOrganizationId = result.activeOrganizationId;
      if (!result.organizations.some((organization) => organization.id === activeOrganizationId)) {
        activeOrganizationId = null;
      }

      if (result.organizations.length === 1 && !activeOrganizationId) {
        const selected = await selectOrganizationFromBrowser(result.organizations[0].id);
        activeOrganizationId = selected.activeOrganizationId;
      }

      setState({
        status: 'ready',
        organizations: result.organizations,
        activeOrganizationId,
      });
    } catch (error) {
      if (error instanceof SessionApiError && error.status === 401) {
        router.replace('/login?error=session-expired');
        router.refresh();
        return;
      }
      setState({
        status: 'error',
        message:
          error instanceof SessionApiError
            ? error.message
            : 'No fue posible cargar tus organizaciones.',
      });
    }
  }, [router]);

  useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    void loadOrganizations();
  }, [loadOrganizations]);

  async function handleOrganizationChange(tenantId: string) {
    setSelectionBusy(true);
    try {
      const selected = await selectOrganizationFromBrowser(tenantId);
      setState((current) =>
        current.status === 'ready'
          ? { ...current, activeOrganizationId: selected.activeOrganizationId }
          : current,
      );
    } catch (error) {
      setState({
        status: 'error',
        message:
          error instanceof SessionApiError
            ? error.message
            : 'No fue posible cambiar de organización.',
      });
    } finally {
      setSelectionBusy(false);
    }
  }

  async function handleLogout() {
    setLogoutBusy(true);
    try {
      await logoutFromBrowser();
      router.replace('/login');
      router.refresh();
    } catch (error) {
      setState({
        status: 'error',
        message:
          error instanceof SessionApiError
            ? `No fue posible cerrar la sesión de forma segura: ${error.message}`
            : 'No fue posible cerrar la sesión de forma segura.',
      });
    } finally {
      setLogoutBusy(false);
    }
  }

  const selectedOrganization =
    state.status === 'ready'
      ? state.organizations.find(({ id }) => id === state.activeOrganizationId)
      : undefined;

  return (
    <main lang="es" className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link className="font-jakarta text-lg font-extrabold text-vibe-plum" href="/">
          Vibe Planners
        </Link>
        <Button loading={logoutBusy} onClick={handleLogout} type="button" variant="secondary">
          Cerrar sesión
        </Button>
      </header>

      <section className="mt-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-vibe-raspberry">
          Espacio de proveedor
        </p>
        <h1 className="mt-2 font-jakarta text-3xl font-extrabold text-vibe-plum">
          Panel de organización
        </h1>

        {state.status === 'loading' && (
          <p aria-live="polite" className="mt-6 text-vibe-plum/75">
            Cargando tus organizaciones…
          </p>
        )}

        {state.status === 'empty' && (
          <div className="mt-6 rounded-2xl border border-vibe-sand bg-white p-6">
            <h2 className="font-jakarta text-xl font-bold text-vibe-plum">
              No tienes una organización proveedora
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-vibe-plum/75">
              Tu cuenta inició sesión correctamente, pero todavía no pertenece a una organización
              como propietaria o proveedora. Contacta al administrador de tu organización para
              obtener acceso.
            </p>
          </div>
        )}

        {state.status === 'ready' && (
          <div className="mt-6 rounded-2xl border border-vibe-sand bg-white p-6">
            <label
              className="block text-sm font-semibold text-vibe-plum"
              htmlFor="active-organization"
            >
              Organización activa
            </label>
            {state.organizations.length > 1 ? (
              <select
                className="mt-2 min-h-12 w-full max-w-lg rounded-xl border border-vibe-sand bg-white px-4 text-vibe-plum outline-none focus-visible:ring-2 focus-visible:ring-vibe-raspberry"
                disabled={selectionBusy}
                id="active-organization"
                onChange={(event) => void handleOrganizationChange(event.target.value)}
                value={state.activeOrganizationId ?? ''}
              >
                <option disabled value="">
                  Selecciona una organización
                </option>
                {state.organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name} ·{' '}
                    {organization.role === 'OWNER' ? 'Propietario' : 'Proveedor'}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-2 font-semibold text-vibe-plum">
                {selectedOrganization?.name}
                {selectedOrganization && (
                  <span className="ml-2 text-sm font-normal text-vibe-plum/70">
                    · {selectedOrganization.role === 'OWNER' ? 'Propietario' : 'Proveedor'}
                  </span>
                )}
              </p>
            )}
            <h2 className="mt-8 font-jakarta text-xl font-bold text-vibe-plum">
              Tu espacio de trabajo
            </h2>
            <p className="mt-2 text-sm leading-6 text-vibe-plum/75">
              La sesión y la organización están listas. Las herramientas de administración se
              habilitarán en entregas posteriores.
            </p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-800" role="alert">
              {state.message}
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                setState({ status: 'loading' });
                void loadOrganizations();
              }}
              type="button"
            >
              Reintentar
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
