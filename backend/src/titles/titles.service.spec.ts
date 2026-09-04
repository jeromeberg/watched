import { ActivityType, Prisma, TitleType, Visibility, WatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService, TmdbTitleMetadata } from '../tmdb/tmdb.service';
import { ActivityService } from '../activity/activity.service';
import { TitlesService } from './titles.service';

/** Create Prisma methods used by title creation. */
function createPrisma() {
  const prisma = {
    title: { upsert: jest.fn() },
    userTitle: {
      createMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;
  prisma.$transaction = jest.fn((callback: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
    callback(prisma as unknown as Prisma.TransactionClient),
  ) as unknown as PrismaService['$transaction'];
  return prisma;
}

/** Create activity methods used by title service tests. */
function createActivityService() {
  return {
    recordTitle: jest.fn(),
    removeTitle: jest.fn(),
  } as unknown as ActivityService;
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
    prisma.userTitle.createMany = jest.fn().mockResolvedValue({ count: 1 });
    prisma.userTitle.findUniqueOrThrow = jest.fn().mockResolvedValue({
      userId: 1,
      titleId: 9,
      addedAt: new Date('2026-01-01'),
      rating: null,
      status: WatchStatus.TO_WATCH,
      notes: null,
    });
    const activityService = createActivityService();

    await new TitlesService(prisma, tmdb, activityService).addTitle(TitleType.MOVIE, 1, {
      tmdbId: 44,
    });

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
    expect(activityService.recordTitle).toHaveBeenCalledWith(
      expect.anything(),
      1,
      9,
      ActivityType.TITLE_ADDED,
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
    prisma.userTitle.createMany = jest.fn().mockResolvedValue({ count: 1 });
    prisma.userTitle.findUniqueOrThrow = jest.fn().mockResolvedValue({
      userId: 2,
      titleId: 9,
      addedAt: new Date('2026-01-01'),
      rating: null,
      status: WatchStatus.TO_WATCH,
      notes: null,
    });

    await new TitlesService(prisma, tmdb, createActivityService()).addTitle(TitleType.TV, 2, {
      tmdbId: 45,
    });

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

describe('TitlesService visibility', () => {
  it('updates visibility on the user-title relation', async () => {
    const prisma = createPrisma();
    prisma.userTitle.findUnique = jest.fn().mockResolvedValue({
      userId: 1,
      titleId: 9,
      rating: null,
      status: WatchStatus.TO_WATCH,
      notes: null,
      visibility: Visibility.PUBLIC,
    });
    prisma.userTitle.update = jest.fn().mockResolvedValue({
      userId: 1,
      titleId: 9,
      rating: null,
      status: WatchStatus.TO_WATCH,
      notes: null,
      visibility: Visibility.PRIVATE,
    });
    const service = new TitlesService(prisma, {} as TmdbService, createActivityService());

    await service.updateUserTitle(1, 9, { visibility: Visibility.PRIVATE });

    expect(prisma.userTitle.update).toHaveBeenCalledWith({
      where: { userId_titleId: { userId: 1, titleId: 9 } },
      data: { visibility: Visibility.PRIVATE },
    });
  });

  it('does not return a private title through a public lookup', async () => {
    const prisma = {
      userTitle: {
        findUnique: jest.fn().mockResolvedValue({
          userId: 1,
          titleId: 9,
          visibility: Visibility.PRIVATE,
          title: { id: 9, type: TitleType.MOVIE },
        }),
      },
    } as unknown as PrismaService;
    const service = new TitlesService(prisma, {} as TmdbService, createActivityService());

    await expect(service.getUserTitle(TitleType.MOVIE, 1, 9, Visibility.PUBLIC)).resolves.toBeNull();
  });
});

describe('TitlesService activity', () => {
  it('records a watched activity only when status changes', async () => {
    const prisma = createPrisma();
    prisma.userTitle.findUnique = jest.fn().mockResolvedValue({
      userId: 1,
      titleId: 9,
      rating: null,
      status: WatchStatus.TO_WATCH,
      notes: null,
      visibility: Visibility.PUBLIC,
    });
    prisma.userTitle.update = jest.fn().mockResolvedValue({
      userId: 1,
      titleId: 9,
      rating: null,
      status: WatchStatus.WATCHED,
      notes: null,
      visibility: Visibility.PUBLIC,
    });
    const activityService = createActivityService();
    const service = new TitlesService(prisma, {} as TmdbService, activityService);

    await service.updateUserTitle(1, 9, { status: WatchStatus.WATCHED });

    expect(activityService.recordTitle).toHaveBeenCalledWith(
      expect.anything(),
      1,
      9,
      ActivityType.TITLE_STATUS_CHANGED,
      { status: WatchStatus.WATCHED },
      true,
    );
  });

  it('does not update or record activity for a no-op change', async () => {
    const prisma = createPrisma();
    prisma.userTitle.findUnique = jest.fn().mockResolvedValue({
      userId: 1,
      titleId: 9,
      rating: 8,
      status: WatchStatus.WATCHED,
      notes: null,
      visibility: Visibility.PUBLIC,
    });
    const activityService = createActivityService();
    const service = new TitlesService(prisma, {} as TmdbService, activityService);

    await service.updateUserTitle(1, 9, { rating: 8 });

    expect(prisma.userTitle.update).not.toHaveBeenCalled();
    expect(activityService.recordTitle).not.toHaveBeenCalled();
  });
});
