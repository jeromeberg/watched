import { forwardRef, InputHTMLAttributes } from 'react';

export type InputVariant = 'surface' | 'modal';

const VARIANT_CLASSES: Record<InputVariant, string> = {
  surface: 'bg-gray-800 rounded-lg px-4 py-2.5',
  modal: 'bg-gray-700 rounded-lg px-4 py-2.5',
};

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { variant = 'modal', className = '', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
});
