import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-vibe-raspberry text-white enabled:hover:bg-vibe-plum',
  secondary: 'border-2 border-vibe-plum bg-transparent text-vibe-plum enabled:hover:bg-vibe-sand',
  quiet: 'text-vibe-raspberry enabled:hover:bg-vibe-sand',
};

export function Button({
  className = '',
  variant = 'primary',
  loading = false,
  disabled,
  children,
  'aria-busy': ariaBusy,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-button px-6 py-2 font-jakarta text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vibe-plum disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || ariaBusy}
      {...props}
    >
      {loading && (
        <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
          <span className="size-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" />
        </span>
      )}
      <span
        className={`inline-flex items-center justify-center gap-2 ${loading ? 'opacity-0' : ''}`}
      >
        {children}
      </span>
    </button>
  );
}
