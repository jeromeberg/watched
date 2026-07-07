import { Link } from 'react-router-dom';
import { CollectionCover } from './CollectionCover';
import { Text } from './Text';
import { CollectionSummary } from '../types';

interface CollectionsGridProps {
  collections: CollectionSummary[];
  basePath: string;
}

export function CollectionsGrid({ collections, basePath }: CollectionsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {collections.map((c) => (
        <Link
          key={c.id}
          to={`${basePath}/${c.id}`}
          className="group block bg-gray-800 rounded-xl overflow-hidden hover:ring-1 hover:ring-gray-600 transition-all"
        >
          <CollectionCover coverPosters={c.coverPosters} />
          <div className="px-3 py-3">
            <Text
              size="sm"
              color="white"
              className="font-semibold leading-tight line-clamp-1 group-hover:text-blue-300 transition-colors"
            >
              {c.name}
            </Text>
            {c.description && (
              <Text size="xs" color="muted" className="mt-0.5 line-clamp-1">
                {c.description}
              </Text>
            )}
            <Text size="xs" color="subtle" className="mt-1">
              {c.itemCount} {c.itemCount === 1 ? 'title' : 'titles'}
            </Text>
          </div>
        </Link>
      ))}
    </div>
  );
}
