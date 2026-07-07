import { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerOutline';
export type ButtonSize = 'sm' | 'md' | 'full';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium disabled:opacity-50',
  secondary:
    'text-[var(--color-muted)] hover:text-white border border-[var(--color-border)] hover:border-[var(--color-border-hover)]',
  ghost: 'text-[var(--color-muted)] hover:text-white',
  danger:
    'bg-[var(--color-danger-strong)] hover:bg-[var(--color-danger-strong-hover)] text-white font-medium disabled:opacity-50',
  dangerOutline:
    'text-[var(--color-danger)] hover:text-[var(--color-danger-hover)] border border-[var(--color-danger-border)] hover:border-[var(--color-danger-border-hover)]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 rounded-lg',
  md: 'px-4 py-2 rounded-lg',
  full: 'flex-1 py-2.5 rounded-lg',
};

// Shared style builder so non-<button> elements (e.g. router <Link>s styled
// as buttons) can reuse the exact same variant/size classes as <Button>.
export function buttonClasses(variant: ButtonVariant = 'secondary', size: ButtonSize = 'sm', className = '') {
  return `text-sm transition-colors ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;
}

// Active/inactive color pair for "pill" toggle groups (filter tabs, sort
// dropdown options, grid/list view toggle) — callers add their own
// size/padding/rounded classes since those vary per usage.
export function pillClasses(active: boolean) {
  return active
    ? 'bg-[var(--color-border)] text-white'
    : 'text-[var(--color-subtle)] hover:text-[var(--color-hover-light)]';
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = 'secondary', size = 'sm', className = '', ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}
