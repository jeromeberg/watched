import { useState } from 'react';
import { Text } from './Text';

interface StarRatingProps {
  value: number | null;
  onChange: (rating: number | null) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function StarRating({ value, onChange, disabled = false, size = 'md' }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);

  const currentStars = value !== null ? value / 2 : 0;
  const displayStars = hover ?? currentStars;
  const starClass = size === 'sm' ? 'text-base' : 'text-2xl';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => setHover(null)}
          onClick={() => {
            if (disabled) return;
            onChange(currentStars === star ? null : star * 2);
          }}
          className={`${starClass} leading-none transition-colors ${
            disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } ${star <= displayStars ? 'text-yellow-400' : 'text-gray-600'}`}
        >
          ★
        </button>
      ))}
      {value !== null && (
        <Text as="span" size="xs" color="muted" className="ml-1">
          {value}/10
        </Text>
      )}
    </div>
  );
}
