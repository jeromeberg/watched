import { ServiceUnavailableException } from '@nestjs/common';
import { Visibility, WatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { DemoService } from './demo.service';

describe('DemoService', () => {
  const userCount = jest.fn();
  const userCreate = jest.fn();
  const userFindUnique = jest.fn();
  const userDeleteMany = jest.fn();
  const userTitleFindMany = jest.fn();
  const userTitleCreateMany = jest.fn();
  const topPickFindMany = jest.fn();
  const topPickCreateMany = jest.fn();
  const collectionFindMany = jest.fn();
  const collectionCreate = jest.fn();
  const collectionItemCreateMany = jest.fn();
  const followCreate = jest.fn();

  const tx = {
    userTitle: { findMany: userTitleFindMany, createMany: userTitleCreateMany },
    userTopPick: { findMany: topPickFindMany, createMany: topPickCreateMany },
    collection: { findMany: collectionFindMany, create: collectionCreate },
    collectionItem: { createMany: collectionItemCreateMany },
    follow: { create: followCreate },
  };

  const prisma = {
    user: {
      count: userCount,
      create: userCreate,
      findUnique: userFindUnique,
      deleteMany: userDeleteMany,
    },
    $transaction: jest.fn((run: (client: typeof tx) => unknown) => run(tx)),
  } as unknown as PrismaService;

  const issueToken = jest.fn();
  const authService = { issueToken } as unknown as AuthService;
  const service = new DemoService(prisma, authService);

  const expiresAt = new Date('2026-09-05T12:00:00Z');
  const demoUser = { id: 7, username: 'demo-a1b2c3d4', expiresAt };

  beforeEach(() => {
    jest.clearAllMocks();
    userCount.mockResolvedValue(0);
    userCreate.mockResolvedValue(demoUser);
    issueToken.mockReturnValue({ access_token: 'token' });
    userTitleFindMany.mockResolvedValue([]);
    topPickFindMany.mockResolvedValue([]);
    collectionFindMany.mockResolvedValue([]);
  });

  it('creates a temporary account flagged as demo with an expiry', async () => {
    userFindUnique.mockResolvedValue(null);

    await expect(service.createDemoAccount()).resolves.toEqual({
      access_token: 'token',
      username: 'demo-a1b2c3d4',
      expiresAt,
    });

    const { data } = userCreate.mock.calls[0][0] as {
      data: { username: string; isDemo: boolean; expiresAt: Date };
    };
    expect(data.isDemo).toBe(true);
    expect(data.username).toMatch(/^demo-[0-9a-f]{8}$/);
    expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('signs the demo token with a lifetime matching the account', async () => {
    userFindUnique.mockResolvedValue(null);

    await service.createDemoAccount();

    expect(issueToken).toHaveBeenCalledWith(demoUser, '24h');
  });

  it('skips seeding when the source demo account is missing', async () => {
    userFindUnique.mockResolvedValue(null);

    await service.createDemoAccount();

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(followCreate).not.toHaveBeenCalled();
  });

  it('copies the source library, top picks and collections', async () => {
    userFindUnique.mockResolvedValue({ id: 1 });
    userTitleFindMany.mockResolvedValue([
      {
        titleId: 10,
        rating: 8,
        status: WatchStatus.WATCHED,
        notes: 'great',
        visibility: Visibility.PUBLIC,
      },
    ]);
    topPickFindMany.mockResolvedValue([{ titleId: 10, rank: 1 }]);
    collectionFindMany.mockResolvedValue([
      {
        name: 'Favourites',
        description: null,
        visibility: Visibility.PUBLIC,
        items: [{ titleId: 10 }],
      },
    ]);
    collectionCreate.mockResolvedValue({ id: 55 });

    await service.createDemoAccount();

    expect(userTitleCreateMany).toHaveBeenCalledWith({
      data: [
        {
          userId: 7,
          titleId: 10,
          rating: 8,
          status: WatchStatus.WATCHED,
          notes: 'great',
          visibility: Visibility.PUBLIC,
        },
      ],
    });
    expect(topPickCreateMany).toHaveBeenCalledWith({ data: [{ userId: 7, titleId: 10, rank: 1 }] });
    expect(collectionCreate).toHaveBeenCalledWith({
      data: { userId: 7, name: 'Favourites', description: null, visibility: Visibility.PUBLIC },
    });
    expect(collectionItemCreateMany).toHaveBeenCalledWith({
      data: [{ collectionId: 55, titleId: 10 }],
    });
  });

  it('follows the source demo account', async () => {
    userFindUnique.mockResolvedValue({ id: 1 });

    await service.createDemoAccount();

    expect(followCreate).toHaveBeenCalledWith({ data: { followerId: 7, followingId: 1 } });
  });

  it('refuses to create an account once too many demos are live', async () => {
    userCount.mockResolvedValue(200);

    await expect(service.createDemoAccount()).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(userCreate).not.toHaveBeenCalled();
  });

  it('purges only expired demo accounts', async () => {
    userDeleteMany.mockResolvedValue({ count: 2 });

    await expect(service.purgeExpiredDemoAccounts()).resolves.toEqual({ count: 2 });

    const [{ where }] = userDeleteMany.mock.calls[0] as [
      { where: { isDemo: boolean; expiresAt: { lt: Date } } },
    ];
    expect(where.isDemo).toBe(true);
    expect(where.expiresAt.lt).toBeInstanceOf(Date);
  });
});
