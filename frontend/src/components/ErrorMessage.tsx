import { ReactNode } from 'react';
import { Text } from './Text';

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <Text color="danger" className="bg-red-400/10 rounded-lg px-3 py-2">
      {children}
    </Text>
  );
}
