import { ActivityType, Prisma, TitleType, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from './activity.service';

/** Build transaction methods used by activity writer tests. */
function createActivityClient() {
  return {
    activity: { create: jest.fn(), deleteMany: jest.fn() },
    collection: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
    userTitle: { findUnique: jest.fn() },
  } as unknown as Prisma.TransactionClient;
}

describe('ActivityService recording', () => {
  it('records a public user-follow activity', async () => {
    const client = createActivityClient();
    client.user.findUnique = jest.fn().mockResolvedValue({ contentVisibility: Visibility.PUBLIC });
    client.activity.create = jest.fn().mockResolvedValue({ id: 1 });
    const service = new ActivityService({} as PrismaService);

    await service.recordUser(client, 2, 3, ActivityType.USER_FOLLOWED);

    expect(client.activity.create).toHaveBeenCalledWith({
      data: { actorId: 2, type: ActivityType.USER_FOLLOWED, subjectUserId: 3 },
    });
  });

  it('does not record a user-follow activity for a private actor', async () => {
    const client = createActivityClient();
    client.user.findUnique = jest.fn().mockResolvedValue({ contentVisibility: Visibility.PRIVATE });
    const service = new ActivityService({} as PrismaService);

    await service.recordUser(client, 2, 3, ActivityType.USER_FOLLOWED);

    expect(client.activity.create).not.toHaveBeenCalled();
  });

  it('records a public title activity with its owned-title reference', async () => {
    const client = createActivityClient();
    client.user.findUnique = jest.fn().mockResolvedValue({ contentVisibility: Visibility.PUBLIC });
    client.userTitle.findUnique = jest.fn().mockResolvedValue({ visibility: Visibility.PUBLIC });
    client.activity.create = jest.fn().mockResolvedValue({ id: 1 });
    const service = new ActivityService({} as PrismaService);

    await service.recordTitle(client, 2, 9, ActivityType.TITLE_RATING_CHANGED, { rating: 8 });

    expect(client.activity.create).toHaveBeenCalledWith({
      data: {
        actorId: 2,
        type: ActivityType.TITLE_RATING_CHANGED,
        userTitleUserId: 2,
        userTitleTitleId: 9,
        payload: { rating: 8 },
      },
    });
  });

  it('does not record activity for a private title', async () => {
    const client = createActivityClient();
    client.user.findUnique = jest.fn().mockResolvedValue({ contentVisibility: Visibility.PUBLIC });
    client.userTitle.findUnique = jest.fn().mockResolvedValue({ visibility: Visibility.PRIVATE });
    const service = new ActivityService({} as PrismaService);

    await service.recordTitle(client, 2, 9, ActivityType.TITLE_ADDED);

    expect(client.activity.create).not.toHaveBeenCalled();
  });

  it('does not record activity disabled by the central policy', async () => {
    const client = createActivityClient();
    const service = new ActivityService({} as PrismaService);

    await service.recordCollectionItem(client, 2, 4, 9, ActivityType.COLLECTION_ITEM_REMOVED);

    expect(client.user.findUnique).not.toHaveBeenCalled();
    expect(client.activity.create).not.toHaveBeenCalled();
  });
});

describe('ActivityService feed', () => {
  it('returns a cursor page with followed public activity only', async () => {
    const createdAt = new Date('2026-09-04T12:00:00.000Z');
    const prisma = {
      follow: { findMany: jest.fn().mockResolvedValue([{ followingId: 2 }]) },
      activity: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 11,
            type: ActivityType.TITLE_ADDED,
            createdAt,
            actor: { username: 'alice' },
            subjectUser: null,
            payload: null,
            userTitle: {
              title: {
                id: 9,
                type: TitleType.MOVIE,
                title: 'Dune',
                posterUrl: null,
                releaseYear: 2021,
              },
            },
            collection: null,
          },
          {
            id: 10,
            type: ActivityType.COLLECTION_CREATED,
            createdAt,
            actor: { username: 'alice' },
            subjectUser: null,
            payload: null,
            userTitle: null,
            collection: { id: 4, name: 'Favourites', description: null },
          },
        ]),
      },
    } as unknown as PrismaService;
    const service = new ActivityService(prisma);

    await expect(service.getFeed(1, 15, 1)).resolves.toEqual({
      items: [
        {
          id: 11,
          type: ActivityType.TITLE_ADDED,
          createdAt,
          actor: { username: 'alice' },
          subjectUser: null,
          payload: null,
          title: {
            id: 9,
            type: TitleType.MOVIE,
            title: 'Dune',
            posterUrl: null,
            releaseYear: 2021,
          },
          collection: null,
        },
      ],
      nextCursor: 11,
      hasFollowing: true,
    });
    expect(prisma.activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          actorId: { in: [2] },
          actor: { contentVisibility: Visibility.PUBLIC },
          id: { lt: 15 },
        }),
        orderBy: { id: 'desc' },
        take: 2,
      }),
    );
  });

  it('returns the followed user for a user-follow activity', async () => {
    const createdAt = new Date('2026-09-07T12:00:00.000Z');
    const prisma = {
      follow: { findMany: jest.fn().mockResolvedValue([{ followingId: 2 }]) },
      activity: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 12,
            type: ActivityType.USER_FOLLOWED,
            createdAt,
            actor: { username: 'alice' },
            subjectUser: { username: 'bob' },
            payload: null,
            userTitle: null,
            collection: null,
          },
        ]),
      },
    } as unknown as PrismaService;
    const service = new ActivityService(prisma);

    await expect(service.getFeed(1)).resolves.toEqual({
      items: [
        {
          id: 12,
          type: ActivityType.USER_FOLLOWED,
          createdAt,
          actor: { username: 'alice' },
          subjectUser: { username: 'bob' },
          payload: null,
          title: null,
          collection: null,
        },
      ],
      nextCursor: null,
      hasFollowing: true,
    });
    expect(prisma.activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            {
              type: { in: [ActivityType.USER_FOLLOWED] },
              subjectUser: { isNot: null },
            },
          ]),
        }),
        include: expect.objectContaining({
          subjectUser: { select: { username: true } },
        }),
      }),
    );
  });

  it('returns an empty page without querying activity when no users are followed', async () => {
    const prisma = {
      follow: { findMany: jest.fn().mockResolvedValue([]) },
      activity: { findMany: jest.fn() },
    } as unknown as PrismaService;
    const service = new ActivityService(prisma);

    await expect(service.getFeed(1)).resolves.toEqual({
      items: [],
      nextCursor: null,
      hasFollowing: false,
    });
    expect(prisma.activity.findMany).not.toHaveBeenCalled();
  });
});
