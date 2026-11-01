'use client';

import { Heart, ImageOff } from 'lucide-react';
import { useState } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Rating } from './rating';

export type ListingCardProps = Omit<ComponentPropsWithRef<'article'>, 'title'> & {
  title: string;
  city: string;
  imageSrc: string;
  imageAlt: string;
  imageFallbackLabel: string;
  priceFrom: number;
  priceLabel: string;
  currency?: string;
  locale?: string;
  rating: number;
  ratingLabel: string;
  seal?: ReactNode;
  favorite?: boolean;
  favoriteLabel: string;
  onFavoriteChange?: (favorite: boolean) => void;
};

export function ListingCard({
  title,
  city,
  imageSrc,
  imageAlt,
  imageFallbackLabel,
  priceFrom,
  priceLabel,
  currency = 'MXN',
  locale = 'es-MX',
  rating,
  ratingLabel,
  seal,
  favorite = false,
  favoriteLabel,
  onFavoriteChange,
  className = '',
  ...props
}: ListingCardProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const formattedPrice = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(priceFrom);

  return (
    <article
      {...props}
      className={`min-w-0 overflow-hidden rounded-card border border-vibe-sand bg-white font-jakarta text-vibe-plum ${className}`}
    >
      <div className="relative aspect-[4/3] bg-vibe-sand">
        {failedSource === imageSrc ? (
          <div
            role="img"
            aria-label={imageAlt}
            className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm"
          >
            <ImageOff size={28} aria-hidden="true" />
            <span>{imageFallbackLabel}</span>
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={imageAlt}
            width={640}
            height={480}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setFailedSource(imageSrc)}
          />
        )}
        {seal && <div className="absolute left-3 top-3 max-w-[calc(100%-80px)]">{seal}</div>}
        {onFavoriteChange && (
          <button
            type="button"
            aria-label={favoriteLabel}
            aria-pressed={favorite}
            onClick={() => onFavoriteChange(!favorite)}
            className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white text-vibe-raspberry shadow-sm hover:bg-vibe-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vibe-plum"
          >
            <Heart size={20} aria-hidden="true" fill={favorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-semibold [overflow-wrap:anywhere]">{title}</h3>
        <p className="break-words text-sm">{city}</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Rating value={rating} label={ratingLabel} locale={locale} />
          <p className="break-words text-sm">
            {priceLabel} <span className="font-semibold">{formattedPrice}</span>
          </p>
        </div>
      </div>
    </article>
  );
}
