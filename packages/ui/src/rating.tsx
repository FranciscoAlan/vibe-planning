import { Star } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';

export type RatingProps = ComponentPropsWithRef<'span'> & {
  value: number;
  label: string;
  locale?: string;
};

export function Rating({ value, label, locale = 'es-MX', className = '', ...props }: RatingProps) {
  const score = Number.isFinite(value) ? Math.min(5, Math.max(0, value)) : 0;
  const formattedScore = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(score);

  return (
    <span
      {...props}
      role="img"
      aria-label={`${label}: ${formattedScore} / 5`}
      className={`inline-flex items-center gap-1 font-jakarta text-sm text-vibe-plum ${className}`}
    >
      <Star size={16} aria-hidden="true" className="shrink-0 fill-vibe-amber" />
      <span aria-hidden="true">{formattedScore}</span>
    </span>
  );
}
