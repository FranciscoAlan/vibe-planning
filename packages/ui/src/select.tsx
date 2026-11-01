'use client';

import { useId } from 'react';
import type { ComponentPropsWithRef } from 'react';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = Omit<ComponentPropsWithRef<'select'>, 'children'> & {
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
  hint?: string;
  error?: string;
};

export function Select({
  label,
  options,
  placeholder,
  hint,
  error,
  id,
  className = '',
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  const describedBy =
    [ariaDescribedBy, hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="min-w-0 space-y-2 font-jakarta text-vibe-plum">
      <label htmlFor={selectId} className="block break-words text-sm font-semibold">
        {label}
      </label>
      <select
        {...props}
        id={selectId}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={describedBy}
        className={`min-h-[44px] w-full min-w-0 rounded-field border-2 bg-white px-4 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vibe-plum disabled:cursor-not-allowed disabled:bg-vibe-sand ${error ? 'border-vibe-raspberry' : 'border-vibe-plum'} ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
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
