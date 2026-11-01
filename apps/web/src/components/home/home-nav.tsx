'use client';

import Link from 'next/link';
import { Button, Logo } from '@vibe-planners/ui';

export type HomeUnavailableAction = 'provider' | 'register';

export type HomeNavProps = {
  onUnavailableAction: (action: HomeUnavailableAction) => void;
};

export function HomeNav({ onUnavailableAction }: HomeNavProps) {
  return (
    <header className="border-b border-vibe-sand">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link
          href="/"
          aria-label="Vibe Planners, inicio"
          className="inline-flex min-h-[44px] items-center rounded-field focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vibe-plum"
        >
          <Logo />
        </Link>
        <nav aria-label={'Navegaci\u00f3n principal'} className="flex flex-wrap items-center gap-2">
          <Button variant="quiet" type="button" onClick={() => onUnavailableAction('provider')}>
            Ser proveedor
          </Button>
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center justify-center rounded-button px-4 py-2 text-sm font-semibold text-vibe-plum hover:bg-vibe-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vibe-plum"
          >
            Iniciar sesi&oacute;n
          </Link>
          <Button type="button" onClick={() => onUnavailableAction('register')}>
            Registrarse
          </Button>
        </nav>
      </div>
    </header>
  );
}
