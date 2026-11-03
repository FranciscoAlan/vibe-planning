'use client';

import Link from 'next/link';
import { Logo } from '@vibe-planners/ui';

export function HomeNav() {
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
          <Link
            className="inline-flex min-h-[44px] items-center justify-center rounded-button px-4 py-2 text-sm font-semibold text-vibe-raspberry hover:bg-vibe-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vibe-plum"
            href="/register"
          >
            Ser proveedor
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center justify-center rounded-button px-4 py-2 text-sm font-semibold text-vibe-plum hover:bg-vibe-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vibe-plum"
          >
            Iniciar sesi&oacute;n
          </Link>
          <Link
            className="inline-flex min-h-[44px] items-center justify-center rounded-button bg-vibe-raspberry px-6 py-2 text-sm font-semibold text-white hover:bg-vibe-plum focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vibe-plum"
            href="/register"
          >
            Registrarse
          </Link>
        </nav>
      </div>
    </header>
  );
}
