import { useState, FormEvent } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Text } from './Text';
import { Textarea } from './Textarea';
import { Input } from './Input';
import { ErrorMessage } from './ErrorMessage';

interface CollectionFormModalProps {
  initial?: { name: string; description: string };
  heading: string;
  onSubmit: (name: string, description: string) => Promise<void>;
  onClose: () => void;
}

export function CollectionFormModal({ initial, heading, onSubmit, onClose }: CollectionFormModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit(name.trim(), description.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose} className="max-w-sm">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Text as="h2" variant="heading" size="lg">
          {heading}
        </Text>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <div className="space-y-1">
          <Text as="label" className="block">
            Name
          </Text>
          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>

        <div className="space-y-1">
          <Text as="label" className="block">
            Description{' '}
            <Text as="span" color="faint">
              (optional)
            </Text>
          </Text>
          <Textarea
            variant="modal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" size="full" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="full" disabled={loading || !name.trim()}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
