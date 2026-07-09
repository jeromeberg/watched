import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Title, MediaType, Filter, MEDIA, mediaTypeOf } from '../types';
import { GridView, ListView } from './TitlesViews';
import { pathFor, BasePath } from '../utils/titlesPath';
import { ViewToggle } from './ViewToggle';
import { Dropdown } from './Dropdown';
import { TitleDetailModal } from './TitleDetailModal';
import { TitleUpdates } from './Detail';
import { useViewMode } from '../hooks/useViewMode';
import { SortKey, SORTS, sortTitles } from '../utils/titlesSort';
import { Text } from './Text';
import { pillClasses } from './Button';

interface TitlesProps {
  type?: MediaType;
  titles: Title[];
  basePath?: BasePath;
  onRemove?: (id: number) => void;
  onTitleUpdate?: (id: number, updates: TitleUpdates) => void;
  username?: string; // undefined = own
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'to_watch', label: '⊙ To watch' },
  { key: 'watched', label: '✓ Watched' },
];

export function Titles({ type, titles, basePath, onRemove, onTitleUpdate, username }: TitlesProps) {
  const location = useLocation();
  const [viewMode, setViewMode] = useViewMode(type ?? 'mixed');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SortKey>('added_desc');
  const [selected, setSelected] = useState<Title | null>(null);

  const filteredTitles =
    filter === 'all'
      ? titles
      : titles.filter((t) => t.status === (filter === 'watched' ? 'WATCHED' : 'TO_WATCH'));
  const sortedTitles = sortTitles(filteredTitles, sort);

  const counts = {
    all: titles.length,
    to_watch: titles.filter((t) => t.status === 'TO_WATCH').length,
    watched: titles.filter((t) => t.status === 'WATCHED').length,
  };

  const emptyNoun = type ? MEDIA[type].noun : 'title';
  const emptyLabel = type ? MEDIA[type].label.toLowerCase() : 'titles';

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${pillClasses(filter === key)}`}
            >
              {label}
              <span className="ml-1.5 text-gray-500">{counts[key]}</span>
            </button>
          ))}
        </div>
        {titles.length > 0 && (
          <div className="flex items-center gap-2">
            <Dropdown value={sort} options={SORTS} onChange={setSort} />
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>
        )}
      </div>

      {filteredTitles.length === 0 ? (
        <Text color="subtle">
          {titles.length === 0
            ? `Search for a ${emptyNoun} above to start your list.`
            : `No ${emptyLabel} in "${FILTERS.find((f) => f.key === filter)?.label}".`}
        </Text>
      ) : viewMode === 'grid' ? (
        <GridView
          type={type}
          titles={sortedTitles}
          basePath={basePath}
          onRemove={onRemove}
          onSelect={(t) => setSelected(t as Title)}
        />
      ) : (
        <ListView
          type={type}
          titles={sortedTitles}
          basePath={basePath}
          onRemove={onRemove}
          onSelect={(t) => setSelected(t as Title)}
        />
      )}

      {selected && (
        <TitleDetailModal
          type={type ?? mediaTypeOf(selected.type)}
          id={selected.id}
          username={username}
          fullPagePath={`${pathFor(selected, type, basePath)}/${selected.id}`}
          returnPath={location.pathname}
          onClose={() => setSelected(null)}
          onUpdate={onTitleUpdate}
        />
      )}
    </section>
  );
}
