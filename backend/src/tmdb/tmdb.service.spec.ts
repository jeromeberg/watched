import {
  BadGatewayException,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TmdbService } from './tmdb.service';

/** Create a mocked TMDB HTTP response. */
function tmdbResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  };
}

/** Create a TMDB service with a mocked API key. */
function createService() {
  const config = { get: jest.fn().mockReturnValue('test-key') } as unknown as ConfigService;
  return new TmdbService(config);
}

describe('TmdbService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('uses one request for a ten-result movie search and returns lightweight results', async () => {
    const results = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      title: `Movie ${index + 1}`,
      poster_path: `/poster-${index + 1}.jpg`,
      release_date: '2020-01-01',
      overview: 'Not returned by search.',
    }));
    global.fetch = jest.fn().mockResolvedValue(tmdbResponse({ results })) as typeof fetch;

    await expect(createService().searchMovies('movie')).resolves.toEqual(
      results.map((result) => ({
        tmdbId: result.id,
        title: result.title,
        posterUrl: `https://image.tmdb.org/t/p/w500${result.poster_path}`,
        releaseYear: 2020,
      })),
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('limits a search to ten results', async () => {
    const results = Array.from({ length: 11 }, (_, index) => ({
      id: index + 1,
      title: `Movie ${index + 1}`,
      poster_path: null,
      release_date: '',
    }));
    global.fetch = jest.fn().mockResolvedValue(tmdbResponse({ results })) as typeof fetch;

    await expect(createService().searchMovies('movie')).resolves.toHaveLength(10);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('fetches movie metadata in one detail request', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      tmdbResponse({
        id: 11,
        title: 'Authoritative movie',
        poster_path: '/movie.jpg',
        release_date: '2024-03-12',
        imdb_id: 'tt0011',
        overview: 'Authoritative description.',
        credits: { crew: [{ job: 'Director', name: 'Movie Director' }] },
      }),
    ) as typeof fetch;

    await expect(createService().getMovieDetails(11)).resolves.toEqual({
      tmdbId: 11,
      title: 'Authoritative movie',
      posterUrl: 'https://image.tmdb.org/t/p/w500/movie.jpg',
      releaseYear: 2024,
      imdbId: 'tt0011',
      director: 'Movie Director',
      description: 'Authoritative description.',
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('append_to_response=credits'));
  });

  it('fetches TV metadata in one detail request', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      tmdbResponse({
        id: 12,
        name: 'Authoritative show',
        poster_path: '/show.jpg',
        first_air_date: '2023-09-21',
        overview: 'Authoritative show description.',
        created_by: [{ name: 'Creator One' }, { name: 'Creator Two' }],
        external_ids: { imdb_id: 'tt0012' },
      }),
    ) as typeof fetch;

    await expect(createService().getTvDetails(12)).resolves.toEqual({
      tmdbId: 12,
      title: 'Authoritative show',
      posterUrl: 'https://image.tmdb.org/t/p/w500/show.jpg',
      releaseYear: 2023,
      imdbId: 'tt0012',
      director: 'Creator One, Creator Two',
      description: 'Authoritative show description.',
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('append_to_response=external_ids'));
  });

  it.each([
    [404, NotFoundException],
    [401, ServiceUnavailableException],
    [403, ServiceUnavailableException],
    [429, HttpException],
    [500, ServiceUnavailableException],
  ])('maps TMDB status %i to a controlled Nest error', async (status, exception) => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(tmdbResponse({ status_message: 'secret' }, status)) as typeof fetch;

    await expect(createService().getMovieDetails(23)).rejects.toBeInstanceOf(exception);
  });

  it('preserves the rate-limit status for TMDB 429 responses', async () => {
    global.fetch = jest.fn().mockResolvedValue(tmdbResponse({}, 429)) as typeof fetch;

    await expect(createService().getMovieDetails(23)).rejects.toMatchObject({ status: 429 });
  });

  it('maps malformed TMDB responses to a bad gateway error', async () => {
    global.fetch = jest.fn().mockResolvedValue(tmdbResponse({ results: 'invalid' })) as typeof fetch;

    await expect(createService().searchMovies('movie')).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('maps TMDB network failures to a service unavailable error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network offline')) as typeof fetch;

    await expect(createService().searchTv('show')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
