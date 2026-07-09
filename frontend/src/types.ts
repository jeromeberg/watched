export type WatchStatus = 'WATCHED' | 'TO_WATCH';
export type Filter = 'all' | 'to_watch' | 'watched';
export type MediaType = 'movie' | 'show';

// --- Profile ---

export interface PublicProfile {
  username: string;
  bio: string | null;
  topPicks: TopPick[];
  movies: ProfileTitle[];
  shows: ProfileTitle[];
  collections: CollectionSummary[];
}

interface TopPick {
  rank: number;
  title: ProfileTitle;
}

// --- Collections ---

export interface CollectionItem {
  collectionId: number;
  titleId: number;
  addedAt: string;
  title: Title;
}

export interface CollectionDetail {
  id: number;
  name: string;
  description: string | null;
  items: CollectionItem[];
}

export interface CollectionSummary {
  id: number;
  name: string;
  description: string | null;
  itemCount: number;
  coverPosters: string[];
}

// --- Titles ---

export interface PosterItem {
  id: number;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  director: string | null;
  rating: number | null;
  status: WatchStatus;
}

type ProfileTitle = PosterItem;

export interface Title extends PosterItem {
  tmdbId: number;
  type: string;
  notes: string | null;
  description: string | null;
  addedAt?: string;
}

// tmdb
export interface SearchResult {
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  director: string | null;
  description: string | null;
}

export const MEDIA: Record<MediaType, { path: string; label: string; noun: string }> = {
  movie: { path: 'movies', label: 'Movies', noun: 'movie' },
  show: { path: 'shows', label: 'TV shows', noun: 'TV show' },
};

// from raw to MediaType
export function mediaTypeOf(type: string): MediaType {
  return type === 'TV' ? 'show' : 'movie';
}

// --- Shows ---

export interface Episode {
  id: number;
  episodeNumber: number;
  title: string;
  airDate: string | null;
  watched: boolean;
}

export interface Season {
  id: number;
  seasonNumber: number;
  name: string | null;
  episodes: Episode[];
}
