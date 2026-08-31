import { PosterTitle } from '../types';
import { Text } from './Text';

export function Poster({ title }: { title: PosterTitle }) {
  return (
    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
      {title.posterUrl ? (
        <img src={title.posterUrl} alt={title.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-end p-3">
          <Text as="span" size="xs" color="muted" className="line-clamp-4">
            {title.title}
          </Text>
        </div>
      )}
    </div>
  );
}

export function SmallPoster({ title }: { title: PosterTitle }) {
  return (
    <div className="w-10 shrink-0 aspect-[2/3] rounded-md overflow-hidden bg-gray-700">
      {title.posterUrl && (
        <img src={title.posterUrl} alt={title.title} className="w-full h-full object-cover" />
      )}
    </div>
  );
}
