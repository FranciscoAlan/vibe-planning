import type { ComponentPropsWithRef } from 'react';

export type LogoProps = ComponentPropsWithRef<'span'> & {
  variant?: 'light' | 'dark' | 'icon';
  label?: string;
};

export function Logo({
  variant = 'light',
  label = 'Vibe Planners',
  className = '',
  ...props
}: LogoProps) {
  return (
    <span
      {...props}
      role="img"
      aria-label={label}
      className={`inline-flex items-center gap-2 font-jakarta ${variant === 'dark' ? 'text-vibe-cream' : 'text-vibe-plum'} ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        width="44"
        height="44"
        aria-hidden="true"
        className="size-11 shrink-0"
      >
        <rect width="64" height="64" rx="16" fill="#C42A50" />
        <path
          d="M18 24 L32 47 L46 24"
          stroke="#FFF8F1"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M47 9 L49 15 L55 17 L49 19 L47 25 L45 19 L39 17 L45 15 Z" fill="#F6B93B" />
      </svg>
      {variant !== 'icon' && (
        <span aria-hidden="true" className="text-xl">
          <span className="font-extrabold">vibe</span> planners
        </span>
      )}
    </span>
  );
}
