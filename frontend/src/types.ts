export type WatchStatus = 'WATCHED' | 'TO_WATCH';
export type Filter = 'all' | 'to_watch' | 'watched';
export type TitleType = 'MOVIE' | 'TV';
export type MediaType = 'movie' | 'show';
export type Visibility = 'PUBLIC' | 'PRIVATE';

// --- Titles ---

export interface PosterTitle {
  title: string;
  posterUrl: string | null;
}

export interface TitleMetadata extends PosterTitle {
  id: number;
  tmdbId: number;
  type: TitleType;
  releaseYear: number | null;
  imdbId: string | null;
  director: string | null;
  description: string | null;
}

export interface LibraryTitle extends TitleMetadata {
  addedAt: string;
  rating: number | null;
  status: WatchStatus;
  notes: string | null;
  visibility: Visibility;
}

export interface SearchResult extends PosterTitle {
  tmdbId: number;
  releaseYear: number | null;
}

// --- Profile ---

export interface ProfileTopPick {
  rank: number;
  title: TitleMetadata;
}

export interface PublicProfile {
  username: string;
  bio: string | null;
  contentVisibility: Visibility;
  followersCount: number;
  followingCount: number;
  topPicks: ProfileTopPick[];
  movies: LibraryTitle[];
  shows: LibraryTitle[];
  collections: CollectionSummary[];
}

export interface FriendUser {
  username: string;
  bio: string | null;
}

// --- Collections ---

export interface CollectionTitle extends TitleMetadata {
  rating: number | null;
  status: WatchStatus;
  notes: string | null;
  visibility: Visibility;
}

export interface CollectionItem {
  collectionId: number;
  titleId: number;
  addedAt: string;
  title: CollectionTitle;
}

export interface CollectionDetail {
  id: number;
  name: string;
  description: string | null;
  visibility: Visibility;
  items: CollectionItem[];
}

export interface CollectionSummary {
  id: number;
  name: string;
  description: string | null;
  visibility: Visibility;
  itemCount: number;
  coverPosters: string[];
}

export const MEDIA: Record<MediaType, { path: string; label: string; noun: string }> = {
  movie: { path: 'movies', label: 'Movies', noun: 'movie' },
  show: { path: 'shows', label: 'TV shows', noun: 'TV show' },
};

/** Convert the stored title type to its frontend route type. */
export function mediaTypeOf(type: TitleType): MediaType {
  return type === 'TV' ? 'show' : 'movie';
}
