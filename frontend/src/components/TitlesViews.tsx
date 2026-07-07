import { useNavigate } from 'react-router-dom';
import { PosterItem, MediaType } from '../types';
import { Poster, SmallPoster } from './Poster';
import { StarRating } from './Rating';
import { pathFor, BasePath } from '../utils/titlesPath';
import { Text } from './Text';

type ViewTitle = PosterItem & { type?: string };

interface ViewProps {
  type?: MediaType;
  titles: ViewTitle[];
  basePath?: BasePath;
  onRemove?: (id: number) => void;
  onSelect?: (title: ViewTitle) => void;
}

export function GridView({ type, titles, basePath, onRemove, onSelect }: ViewProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
      {titles.map((title) => (
        <div
          key={title.id}
          className="cursor-pointer group"
          onClick={() =>
            onSelect ? onSelect(title) : navigate(`${pathFor(title, type, basePath)}/${title.id}`)
          }
        >
          <div className="relative">
            <Poster title={title} />
            <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors" />
            {title.status === 'WATCHED' && (
              <div className="absolute top-1.5 right-1.5 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs font-bold shadow">
                ✓
              </div>
            )}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(title.id);
                }}
                className="absolute top-1.5 left-1.5 bg-black/70 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Remove"
              >
                ✕
              </button>
            )}
          </div>
          <div className="mt-2">
            <Text size="sm" color="white" className="font-medium leading-tight line-clamp-1">
              {title.title}
            </Text>
            <Text size="xs" color="muted">
              {title.releaseYear ?? '—'}
            </Text>
            <Text size="xs" color="faint">
              {title.director ?? '—'}
            </Text>
            {title.rating !== null && (
              <div className="mt-1">
                <StarRating value={title.rating} onChange={() => {}} disabled size="sm" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListView({ type, titles, basePath, onRemove, onSelect }: ViewProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-1">
      {titles.map((title) => (
        <div
          key={title.id}
          onClick={() =>
            onSelect ? onSelect(title) : navigate(`${pathFor(title, type, basePath)}/${title.id}`)
          }
          className="flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-gray-800 cursor-pointer transition-colors group"
        >
          <SmallPoster title={title} />
          <div className="flex-1 min-w-0">
            <Text size="base" color="white" className="font-medium truncate">
              {title.title}
            </Text>
            <Text size="xs" color="muted">
              {title.releaseYear ?? '—'} · {title.director ?? '—'}
            </Text>
            <Text as="span" color={title.status === 'WATCHED' ? 'success' : 'subtle'}>
              {title.status === 'WATCHED' ? 'Watched' : 'To watch'}
            </Text>
          </div>
          {title.rating !== null && (
            <StarRating value={title.rating} onChange={() => {}} disabled size="sm" />
          )}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(title.id);
              }}
              className="text-gray-600 hover:text-red-400 transition-colors text-sm opacity-0 group-hover:opacity-100 shrink-0"
              title="Remove"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
