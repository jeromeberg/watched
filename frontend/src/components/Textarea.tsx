import { TextareaHTMLAttributes } from 'react';

export type TextareaVariant = 'surface' | 'modal';

const VARIANT_CLASSES: Record<TextareaVariant, string> = {
  surface: 'bg-gray-800 rounded-xl px-4 py-3',
  modal: 'bg-gray-700 rounded-lg px-4 py-2.5',
};

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: TextareaVariant;
}

export function Textarea({ variant = 'surface', className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600 resize-none ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
