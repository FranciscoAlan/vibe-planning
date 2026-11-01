import { BadgeCheck, Megaphone, Sparkles, Star } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';

export type SealVariant = 'verified' | 'top' | 'advertised' | 'new';

export type SealProps = ComponentPropsWithRef<'span'> & {
  variant: SealVariant;
  label: string;
};

const icons = {
  verified: BadgeCheck,
  top: Star,
  advertised: Megaphone,
  new: Sparkles,
};

export function Seal({ variant, label, className = '', ...props }: SealProps) {
  const Icon = icons[variant];

  return (
    <span
      {...props}
      className={`inline-flex max-w-full items-center gap-1 rounded-full px-3 py-1 font-jakarta text-xs font-semibold ${variant === 'verified' ? 'bg-vibe-plum text-vibe-cream' : 'bg-vibe-amber text-vibe-plum'} ${className}`}
    >
      <Icon size={14} aria-hidden="true" className="shrink-0" />
      <span className="break-words">{label}</span>
    </span>
  );
}
