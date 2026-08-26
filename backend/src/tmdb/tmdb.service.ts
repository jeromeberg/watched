import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TmdbSearchResult {
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
}

export interface TmdbTitleMetadata extends TmdbSearchResult {
  imdbId: string | null;
  director: string | null;
  description: string | null;
}

@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly imageBase = 'https://image.tmdb.org/t/p/w500';

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('TMDB_API_KEY') ?? '';
  }

  /** Request TMDB and translate upstream failures into stable API errors. */
  private async get<T>(path: string, operation: string, isDetail = false): Promise<T> {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}${path}${sep}api_key=${this.apiKey}&language=en-US`;
    let res: Response;

    try {
      res = await fetch(url);
    } catch (error) {
      this.logger.error(`TMDB ${operation} request failed due to a network error (${this.errorType(error)})`);
      throw new ServiceUnavailableException('TMDB is temporarily unavailable. Try again later.');
    }

    if (!res.ok) {
      this.logger.warn(`TMDB ${operation} request failed with status=${res.status}`);
      throw this.responseException(res.status, isDetail);
    }

    try {
      return (await res.json()) as T;
    } catch (error) {
      this.logger.error(`TMDB ${operation} returned invalid JSON (${this.errorType(error)})`);
      throw new BadGatewayException('TMDB returned an invalid response.');
    }
  }

  private responseException(status: number, isDetail: boolean) {
    if (status === 404 && isDetail) return new NotFoundException('Title not found.');
    if (status === 401 || status === 403) {
      return new ServiceUnavailableException('TMDB configuration is unavailable.');
    }
    if (status === 429) {
      return new HttpException(
        'TMDB is temporarily unavailable. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (status >= 500)
      return new ServiceUnavailableException('TMDB is temporarily unavailable. Try again later.');
    return new BadGatewayException('TMDB returned an unexpected response.');
  }

  private errorType(error: unknown) {
    return error instanceof Error ? error.name : typeof error;
  }

  private posterUrl(path: string | null): string | null {
    return path ? `${this.imageBase}${path}` : null;
  }

  private malformedResponse(): never {
    throw new BadGatewayException('TMDB returned an invalid response.');
  }

  private record(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) this.malformedResponse();
    return value as Record<string, unknown>;
  }

  private positiveId(value: unknown): number {
    if (!Number.isInteger(value) || (value as number) < 1) this.malformedResponse();
    return value as number;
  }

  private detailId(value: unknown, requestedId: number): number {
    const tmdbId = this.positiveId(value);
    if (tmdbId !== requestedId) this.malformedResponse();
    return tmdbId;
  }

  private requiredString(value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) this.malformedResponse();
    return value;
  }

  private nullableString(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string') this.malformedResponse();
    return value;
  }

  private releaseYear(value: unknown): number | null {
    const date = this.nullableString(value);
    if (!date) return null;
    const year = Number.parseInt(date.slice(0, 4), 10);
    return Number.isInteger(year) ? year : null;
  }

  private searchResults(data: unknown): Record<string, unknown>[] {
    const results = this.record(data).results;
    if (!Array.isArray(results)) this.malformedResponse();
    return results.map((result) => this.record(result));
  }

  private movieSearchResult(result: Record<string, unknown>): TmdbSearchResult {
    return {
      tmdbId: this.positiveId(result.id),
      title: this.requiredString(result.title),
      posterUrl: this.posterUrl(this.nullableString(result.poster_path)),
      releaseYear: this.releaseYear(result.release_date),
    };
  }

  private tvSearchResult(result: Record<string, unknown>): TmdbSearchResult {
    return {
      tmdbId: this.positiveId(result.id),
      title: this.requiredString(result.name),
      posterUrl: this.posterUrl(this.nullableString(result.poster_path)),
      releaseYear: this.releaseYear(result.first_air_date),
    };
  }

  async searchMovies(query: string): Promise<TmdbSearchResult[]> {
    const data = await this.get<unknown>(
      `/search/movie?query=${encodeURIComponent(query)}&page=1`,
      'movie search',
    );
    return this.searchResults(data)
      .slice(0, 10)
      .map((result) => this.movieSearchResult(result));
  }

  async searchTv(query: string): Promise<TmdbSearchResult[]> {
    const data = await this.get<unknown>(`/search/tv?query=${encodeURIComponent(query)}&page=1`, 'TV search');
    return this.searchResults(data)
      .slice(0, 10)
      .map((result) => this.tvSearchResult(result));
  }

  private director(credits: unknown): string | null {
    const crew = this.record(credits).crew;
    if (!Array.isArray(crew)) this.malformedResponse();
    const director = crew.map((member) => this.record(member)).find((member) => member.job === 'Director');
    return director ? this.requiredString(director.name) : null;
  }

  private creators(createdBy: unknown): string | null {
    if (!Array.isArray(createdBy)) this.malformedResponse();
    const names = createdBy.map((creator) => this.requiredString(this.record(creator).name));
    return names.length ? names.join(', ') : null;
  }

  async getMovieDetails(tmdbId: number): Promise<TmdbTitleMetadata> {
    const data = this.record(
      await this.get<unknown>(`/movie/${tmdbId}?append_to_response=credits`, 'movie detail', true),
    );
    return {
      tmdbId: this.detailId(data.id, tmdbId),
      title: this.requiredString(data.title),
      posterUrl: this.posterUrl(this.nullableString(data.poster_path)),
      releaseYear: this.releaseYear(data.release_date),
      imdbId: this.nullableString(data.imdb_id),
      director: this.director(data.credits),
      description: this.nullableString(data.overview),
    };
  }

  async getTvDetails(tmdbId: number): Promise<TmdbTitleMetadata> {
    const data = this.record(
      await this.get<unknown>(`/tv/${tmdbId}?append_to_response=external_ids`, 'TV detail', true),
    );
    return {
      tmdbId: this.detailId(data.id, tmdbId),
      title: this.requiredString(data.name),
      posterUrl: this.posterUrl(this.nullableString(data.poster_path)),
      releaseYear: this.releaseYear(data.first_air_date),
      imdbId: this.nullableString(this.record(data.external_ids).imdb_id),
      director: this.creators(data.created_by),
      description: this.nullableString(data.overview),
    };
  }
}
