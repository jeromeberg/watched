import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { Text } from './Text';
import { Visibility } from '../types';

interface VisibilityControlProps {
  value: Visibility;
  onChange: (visibility: Visibility) => void;
  saving?: boolean;
  error?: string;
  description?: string;
}

/** Let an owner choose whether content is public or private. */
export function VisibilityControl({
  value,
  onChange,
  saving = false,
  error = '',
  description,
}: VisibilityControlProps) {
  return (
    <div className="space-y-3">
      <div>
        <Text variant="label">Visibility</Text>
        {description && (
          <Text size="sm" color="muted" className="mt-1">
            {description}
          </Text>
        )}
      </div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <div className="flex gap-2" role="group" aria-label="Visibility">
        <Button
          type="button"
          variant={value === 'PUBLIC' ? 'primary' : 'secondary'}
          aria-pressed={value === 'PUBLIC'}
          disabled={saving}
          onClick={() => onChange('PUBLIC')}
        >
          Public
        </Button>
        <Button
          type="button"
          variant={value === 'PRIVATE' ? 'primary' : 'secondary'}
          aria-pressed={value === 'PRIVATE'}
          disabled={saving}
          onClick={() => onChange('PRIVATE')}
        >
          Private
        </Button>
        {saving && <Text color="subtle">Saving...</Text>}
      </div>
    </div>
  );
}
