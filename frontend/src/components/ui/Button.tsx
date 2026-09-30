import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-white border-primary hover:bg-primary-hover',
  secondary: 'bg-white text-ink border-line hover:bg-toolbar',
  danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-interactive-bg-secondary-hover',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'secondary', className, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
}

/** Small square icon button, as in the reference toolbar. */
export function IconButton({ className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-ink',
        'hover:bg-toolbar disabled:opacity-50',
        className,
      )}
      {...rest}
    />
  );
}
