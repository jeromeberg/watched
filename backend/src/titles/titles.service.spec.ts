import { TitleType, WatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService, TmdbTitleMetadata } from '../tmdb/tmdb.service';
import { TitlesService } from './titles.service';

/** Create Prisma methods used by title creation. */
function createPrisma() {
  return {
    title: { upsert: jest.fn() },
    userTitle: { upsert: jest.fn() },
  } as unknown as PrismaService;
}

/** Build an authoritative title record returned by TMDB. */
function metadata(overrides: Partial<TmdbTitleMetadata> = {}): TmdbTitleMetadata {
  return {
    tmdbId: 44,
    title: 'Authoritative title',
    posterUrl: 'https://image.tmdb.org/t/p/w500/title.jpg',
    releaseYear: 2024,
    imdbId: 'tt0044',
    director: 'Authoritative creator',
    description: 'Authoritative description.',
    ...overrides,
  };
}

/** Return the global title shape Prisma provides after an upsert. */
function storedTitle(type: TitleType, values: TmdbTitleMetadata) {
  return { id: 9, type, ...values };
}

describe('TitlesService addTitle', () => {
  it('fetches and stores authoritative movie metadata', async () => {
    const prisma = createPrisma();
    const movie = metadata({ director: 'Movie Director' });
    const tmdb = {
      getMovieDetails: jest.fn().mockResolvedValue(movie),
      getTvDetails: jest.fn(),
    } as unknown as TmdbService;
    prisma.title.upsert = jest.fn().mockResolvedValue(storedTitle(TitleType.MOVIE, movie));
    prisma.userTitle.upsert = jest.fn().mockResolvedValue({
      userId: 1,
      titleId: 9,
      addedAt: new Date('2026-01-01'),
      rating: null,
      status: WatchStatus.TO_WATCH,
      notes: null,
    });

    await new TitlesService(prisma, tmdb).addTitle(TitleType.MOVIE, 1, { tmdbId: 44 });

    expect(tmdb.getMovieDetails).toHaveBeenCalledWith(44);
    expect(tmdb.getTvDetails).not.toHaveBeenCalled();
    expect(prisma.title.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          title: 'Authoritative title',
          imdbId: 'tt0044',
          director: 'Movie Director',
          description: 'Authoritative description.',
        }),
      }),
    );
  });

  it('fetches and stores authoritative TV creator metadata', async () => {
    const prisma = createPrisma();
    const show = metadata({ tmdbId: 45, director: 'TV Creator' });
    const tmdb = {
      getMovieDetails: jest.fn(),
      getTvDetails: jest.fn().mockResolvedValue(show),
    } as unknown as TmdbService;
    prisma.title.upsert = jest.fn().mockResolvedValue(storedTitle(TitleType.TV, show));
    prisma.userTitle.upsert = jest.fn().mockResolvedValue({
      userId: 2,
      titleId: 9,
      addedAt: new Date('2026-01-01'),
      rating: null,
      status: WatchStatus.TO_WATCH,
      notes: null,
    });

    await new TitlesService(prisma, tmdb).addTitle(TitleType.TV, 2, { tmdbId: 45 });

    expect(tmdb.getTvDetails).toHaveBeenCalledWith(45);
    expect(tmdb.getMovieDetails).not.toHaveBeenCalled();
    expect(prisma.title.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          title: 'Authoritative title',
          imdbId: 'tt0044',
          director: 'TV Creator',
          description: 'Authoritative description.',
        }),
      }),
    );
  });
});
