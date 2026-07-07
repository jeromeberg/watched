import { ReactNode, MouseEvent, useEffect } from 'react';

interface ModalProps {
  onClose: () => void;
  className?: string;
  children: ReactNode;
}

export function Modal({ onClose, className = '', children }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function stop(e: MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4" onClick={onClose}>
      <div className={`bg-gray-900 rounded-2xl shadow-2xl w-full ${className}`} onClick={stop}>
        {children}
      </div>
    </div>
  );
}
