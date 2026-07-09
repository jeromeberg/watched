import { ElementType, HTMLAttributes, ReactNode } from 'react';
import { Text } from './Text';

export type ContainerVariant = 'default' | 'danger';

const VARIANT_CLASSES: Record<ContainerVariant, string> = {
  default: 'bg-gray-800',
  danger: 'border border-[var(--color-danger-border)]',
};

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  variant?: ContainerVariant;
  as?: ElementType;
  label?: ReactNode;
}

export function Container({
  variant = 'default',
  as: Component = 'div',
  label,
  className = '',
  ...props
}: ContainerProps) {
  return (
    <section className="space-y-3">
      {label && (
        <Text as="h2" variant="label" color={variant === 'danger' ? 'danger' : undefined}>
          {label}
        </Text>
      )}
      <Component className={`rounded-xl p-6 ${VARIANT_CLASSES[variant]} ${className}`} {...props} />
    </section>
  );
}
