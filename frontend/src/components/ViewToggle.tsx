import type { ViewMode } from '../hooks/useViewMode';
import { pillClasses } from './Button';

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
      <circle cx="2" cy="3" r="1.5" />
      <rect x="5" y="2" width="10" height="2" rx="1" />
      <circle cx="2" cy="8" r="1.5" />
      <rect x="5" y="7" width="10" height="2" rx="1" />
      <circle cx="2" cy="13" r="1.5" />
      <rect x="5" y="12" width="10" height="2" rx="1" />
    </svg>
  );
}

export function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="flex gap-0.5 bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => onChange('grid')}
        title="Gallery view"
        className={`p-1.5 rounded transition-colors ${pillClasses(mode === 'grid')}`}
      >
        <GridIcon />
      </button>
      <button
        onClick={() => onChange('list')}
        title="List view"
        className={`p-1.5 rounded transition-colors ${pillClasses(mode === 'list')}`}
      >
        <ListIcon />
      </button>
    </div>
  );
}
