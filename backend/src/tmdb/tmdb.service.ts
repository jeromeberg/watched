import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TmdbMovieResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string | null;
}

interface TmdbTvResult {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  overview: string | null;
}

interface TmdbCredits {
  crew: { job: string; name: string }[];
}

interface TmdbTvDetails {
  created_by: { name: string }[];
}

export interface TmdbSeasonSummary {
  season_number: number;
  name: string;
  episode_count: number;
}

export interface TmdbEpisode {
  episode_number: number;
  name: string;
  air_date: string | null;
}

@Injectable()
export class TmdbService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly imageBase = 'https://image.tmdb.org/t/p/w500';

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('TMDB_API_KEY') ?? '';
  }

  private async get<T>(path: string): Promise<T> {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${path}${sep}api_key=${this.apiKey}&language=en-US`;
    const res = await fetch(url);
    return res.json() as Promise<T>;
  }

  private posterUrl(path: string | null): string | null {
    return path ? `${this.imageBase}${path}` : null;
  }

  async searchMovies(query: string) {
    const data = await this.get<{ results: TmdbMovieResult[] }>(
      `/search/movie?query=${encodeURIComponent(query)}&page=1`,
    );
    const results = (data.results ?? []).slice(0, 10);
    return Promise.all(
      results.map(async (m) => ({
        tmdbId: m.id,
        title: m.title,
        posterUrl: this.posterUrl(m.poster_path),
        releaseYear: m.release_date ? parseInt(m.release_date.slice(0, 4), 10) : null,
        director: await this.getMovieDirector(m.id),
        description: m.overview || null,
      })),
    );
  }

  async searchTv(query: string) {
    const data = await this.get<{ results: TmdbTvResult[] }>(
      `/search/tv?query=${encodeURIComponent(query)}&page=1`,
    );
    const results = (data.results ?? []).slice(0, 10);
    return Promise.all(
      results.map(async (s) => ({
        tmdbId: s.id,
        title: s.name,
        posterUrl: this.posterUrl(s.poster_path),
        releaseYear: s.first_air_date ? parseInt(s.first_air_date.slice(0, 4), 10) : null,
        director: await this.getTvCreator(s.id),
        description: s.overview || null,
      })),
    );
  }

  private async getMovieDirector(tmdbId: number): Promise<string | null> {
    const data = await this.get<TmdbCredits>(`/movie/${tmdbId}/credits`);
    return data.crew?.find((c) => c.job === 'Director')?.name ?? null;
  }

  private async getTvCreator(tmdbId: number): Promise<string | null> {
    const data = await this.get<TmdbTvDetails>(`/tv/${tmdbId}`);
    const names = (data.created_by ?? []).map((c) => c.name);
    return names.length > 0 ? names.join(', ') : null;
  }

  async getTvSeasons(tmdbId: number): Promise<TmdbSeasonSummary[]> {
    const data = await this.get<{ seasons: TmdbSeasonSummary[] }>(`/tv/${tmdbId}`);
    return data.seasons ?? [];
  }

  async getSeasonEpisodes(tmdbId: number, seasonNumber: number): Promise<TmdbEpisode[]> {
    const data = await this.get<{ episodes: TmdbEpisode[] }>(`/tv/${tmdbId}/season/${seasonNumber}`);
    return data.episodes ?? [];
  }

  async getMovieImdbId(tmdbId: number): Promise<string | null> {
    const data = await this.get<{ imdb_id?: string | null }>(`/movie/${tmdbId}`);
    return data.imdb_id ?? null;
  }

  async getTvImdbId(tmdbId: number): Promise<string | null> {
    const data = await this.get<{ imdb_id?: string | null }>(`/tv/${tmdbId}/external_ids`);
    return data.imdb_id ?? null;
  }
}
