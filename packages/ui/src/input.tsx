'use client';

import { useId } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export type InputProps = Omit<ComponentPropsWithRef<'input'>, 'children'> & {
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
};

export function Input({
  label,
  hint,
  error,
  icon,
  id,
  className = '',
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy =
    [ariaDescribedBy, hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="min-w-0 space-y-2 font-jakarta text-vibe-plum">
      <label htmlFor={inputId} className="block break-words text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-4 flex items-center"
          >
            {icon}
          </span>
        )}
        <input
          {...props}
          id={inputId}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={describedBy}
          className={`min-h-[44px] w-full min-w-0 rounded-field border-2 bg-white px-4 py-2 text-base placeholder:text-vibe-plum/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vibe-plum disabled:cursor-not-allowed disabled:bg-vibe-sand ${error ? 'border-vibe-raspberry' : 'border-vibe-plum'} ${icon ? 'pl-12' : ''} ${className}`}
        />
      </div>
      {hint && (
        <p id={hintId} className="break-words text-sm">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="break-words text-sm text-vibe-raspberry">
          {error}
        </p>
      )}
    </div>
  );
}
