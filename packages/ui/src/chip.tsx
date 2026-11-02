import type { ComponentPropsWithRef } from 'react';

export type ChipProps = Omit<ComponentPropsWithRef<'button'>, 'aria-pressed'> & {
  selected?: boolean;
  variant?: 'solid' | 'dashed';
};

export function Chip({
  selected = false,
  variant = 'solid',
  type = 'button',
  className = '',
  ...props
}: ChipProps) {
  return (
    <button
      {...props}
      type={type}
      aria-pressed={selected}
      className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-button border px-4 py-2 font-jakarta text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vibe-plum disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'border-vibe-plum bg-vibe-plum text-vibe-cream' : 'border-transparent bg-vibe-amber text-vibe-plum enabled:hover:bg-vibe-sand'} ${variant === 'dashed' ? 'border-dashed !border-vibe-plum' : ''} ${className}`}
    />
  );
}
