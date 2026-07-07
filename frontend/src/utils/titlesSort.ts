import { Title } from '../types';

export type SortKey =
  'added_desc' | 'added_asc' | 'rating_desc' | 'rating_asc' | 'release_desc' | 'release_asc';

export const SORTS: { key: SortKey; label: string }[] = [
  { key: 'added_desc', label: 'Date added (newest first)' },
  { key: 'added_asc', label: 'Date added (oldest first)' },
  { key: 'rating_desc', label: 'Rating (highest first)' },
  { key: 'rating_asc', label: 'Rating (lowest first)' },
  { key: 'release_desc', label: 'Release date (most recent)' },
  { key: 'release_asc', label: 'Release date (oldest)' },
];

function compareNullable(a: number | null, b: number | null, dir: 1 | -1): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * dir;
}

function parseDate(v?: string): number | null {
  if (!v) return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

export function sortTitles(titles: Title[], sort: SortKey): Title[] {
  return [...titles].sort((a, b) => {
    switch (sort) {
      case 'added_desc':
        return compareNullable(parseDate(a.addedAt), parseDate(b.addedAt), -1);
      case 'added_asc':
        return compareNullable(parseDate(a.addedAt), parseDate(b.addedAt), 1);
      case 'rating_desc':
        return compareNullable(a.rating, b.rating, -1);
      case 'rating_asc':
        return compareNullable(a.rating, b.rating, 1);
      case 'release_desc':
        return compareNullable(a.releaseYear, b.releaseYear, -1);
      case 'release_asc':
        return compareNullable(a.releaseYear, b.releaseYear, 1);
    }
  });
}
