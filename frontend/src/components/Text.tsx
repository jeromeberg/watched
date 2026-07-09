import { ElementType, HTMLAttributes } from 'react';

export type TextVariant = 'body' | 'label' | 'link' | 'heading';
export type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
export type TextColor = 'white' | 'muted' | 'subtle' | 'faint' | 'danger' | 'success' | 'accent';

const SIZE_CLASSES: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
};

const COLOR_CLASSES: Record<TextColor, string> = {
  white: 'text-white',
  muted: 'text-[var(--color-muted)]',
  subtle: 'text-[var(--color-subtle)]',
  faint: 'text-[var(--color-faint)]',
  danger: 'text-[var(--color-danger)]',
  success: 'text-[var(--color-success)]',
  accent: 'text-[var(--color-accent)]',
};

const DEFAULT_SIZE: Record<TextVariant, TextSize> = {
  body: 'sm',
  label: 'xs',
  link: 'sm',
  heading: 'base',
};

const DEFAULT_COLOR: Record<TextVariant, TextColor> = {
  body: 'muted',
  label: 'muted',
  link: 'muted',
  heading: 'white',
};

const HEADING_WEIGHT: Record<TextSize, string> = {
  xs: 'font-medium',
  sm: 'font-medium',
  base: 'font-semibold',
  lg: 'font-semibold',
  xl: 'font-bold',
  '2xl': 'font-bold',
  '3xl': 'font-bold',
};

const LINK_HOVER: Record<TextColor, string> = {
  white: 'hover:text-[var(--color-hover-light)]',
  muted: 'hover:text-white',
  subtle: 'hover:text-white',
  faint: 'hover:text-white',
  danger: 'hover:text-[var(--color-danger-hover)]',
  success: 'hover:text-[var(--color-success-hover)]',
  accent: 'hover:text-[var(--color-accent-hover)]',
};

export function textClasses(
  variant: TextVariant = 'body',
  size?: TextSize,
  color?: TextColor,
  className = '',
) {
  const resolvedSize = size ?? DEFAULT_SIZE[variant];
  const resolvedColor = color ?? DEFAULT_COLOR[variant];
  const extra =
    variant === 'heading'
      ? HEADING_WEIGHT[resolvedSize]
      : variant === 'label'
        ? 'uppercase tracking-wider'
        : variant === 'link'
          ? `${LINK_HOVER[resolvedColor]} transition-colors`
          : '';
  return `${SIZE_CLASSES[resolvedSize]} ${COLOR_CLASSES[resolvedColor]} ${extra} ${className}`.trim();
}

interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  size?: TextSize;
  color?: TextColor;
  as?: ElementType;
}

export function Text({
  variant = 'body',
  size,
  color,
  as: Component = 'p',
  className = '',
  ...props
}: TextProps) {
  return <Component className={textClasses(variant, size, color, className)} {...props} />;
}
