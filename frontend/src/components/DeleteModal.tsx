import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Text } from './Text';
import { ErrorMessage } from './ErrorMessage';

interface DeleteModalProps {
  heading: string;
  message: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function DeleteModal({ heading, message, onConfirm, onClose }: DeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose} className="max-w-sm p-6 space-y-4">
      <Text as="h2" variant="heading" size="lg">
        {heading}
      </Text>
      <Text>{message}</Text>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="ghost" size="full" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="danger" size="full" onClick={handleConfirm} disabled={loading}>
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </Modal>
  );
}
