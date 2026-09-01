import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TitleType, Visibility, WatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TitlesService } from '../titles/titles.service';
import { CollectionsService } from '../collections/collections.service';
import { UsersService } from './users.service';

describe('UsersService follows', () => {
  const userFindUnique = jest.fn();
  const followFindUnique = jest.fn();
  const followUpsert = jest.fn();
  const followDeleteMany = jest.fn();
  const userUpdate = jest.fn();
  const topPickFindMany = jest.fn();
  const collectionFindMany = jest.fn();
  const prisma = {
    user: { findUnique: userFindUnique, update: userUpdate },
    follow: {
      findUnique: followFindUnique,
      upsert: followUpsert,
      deleteMany: followDeleteMany,
    },
    userTopPick: { findMany: topPickFindMany },
    collection: { findMany: collectionFindMany },
  } as unknown as PrismaService;
  const getUserTitles = jest.fn();
  const getUserTitle = jest.fn();
  const titlesService = { getUserTitles, getUserTitle } as unknown as TitlesService;
  const findPublicOne = jest.fn();
  const collectionsService = { findPublicOne } as unknown as CollectionsService;
  const service = new UsersService(prisma, titlesService, collectionsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a directed follow relation', async () => {
    userFindUnique.mockResolvedValue({ id: 2, username: 'bob' });

    await expect(service.follow(1, 'bob')).resolves.toEqual({ isFollowing: true });
    expect(followUpsert).toHaveBeenCalledWith({
      where: { followerId_followingId: { followerId: 1, followingId: 2 } },
      create: { followerId: 1, followingId: 2 },
      update: {},
    });
  });

  it('rejects following your own profile', async () => {
    userFindUnique.mockResolvedValue({ id: 1, username: 'alice' });

    await expect(service.follow(1, 'alice')).rejects.toBeInstanceOf(BadRequestException);
    expect(followUpsert).not.toHaveBeenCalled();
  });

  it('removes an existing directed follow relation', async () => {
    userFindUnique.mockResolvedValue({ id: 2, username: 'bob' });

    await expect(service.unfollow(1, 'bob')).resolves.toEqual({ isFollowing: false });
    expect(followDeleteMany).toHaveBeenCalledWith({ where: { followerId: 1, followingId: 2 } });
  });

  it('returns the current follow status', async () => {
    userFindUnique.mockResolvedValue({ id: 2, username: 'bob' });
    followFindUnique.mockResolvedValue({ followerId: 1 });

    await expect(service.getFollowStatus(1, 'bob')).resolves.toEqual({ isFollowing: true });
  });

  it('maps follower rows to public user summaries', async () => {
    userFindUnique.mockResolvedValue({
      followers: [{ follower: { username: 'alice', bio: 'Thrillers' } }],
    });

    await expect(service.getFollowers('bob')).resolves.toEqual([{ username: 'alice', bio: 'Thrillers' }]);
  });

  it('returns no library content for a globally private public profile', async () => {
    userFindUnique.mockResolvedValue({
      id: 2,
      username: 'bob',
      bio: null,
      contentVisibility: Visibility.PRIVATE,
      _count: { followers: 3, following: 4 },
    });

    await expect(service.getPublicProfile('bob')).resolves.toMatchObject({
      contentVisibility: Visibility.PRIVATE,
      topPicks: [],
      movies: [],
      shows: [],
      collections: [],
    });
    expect(getUserTitles).not.toHaveBeenCalled();
    expect(collectionFindMany).not.toHaveBeenCalled();
  });

  it('filters every public profile content query by visibility', async () => {
    userFindUnique.mockResolvedValue({
      id: 2,
      username: 'bob',
      bio: null,
      contentVisibility: Visibility.PUBLIC,
      _count: { followers: 0, following: 0 },
    });
    topPickFindMany.mockResolvedValue([]);
    collectionFindMany.mockResolvedValue([]);
    getUserTitles.mockResolvedValue([]);

    await service.getPublicProfile('bob');

    expect(getUserTitles).toHaveBeenCalledWith(TitleType.MOVIE, 2, {
      status: WatchStatus.WATCHED,
      limit: 10,
      visibility: Visibility.PUBLIC,
    });
    expect(topPickFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 2,
          title: { userTitles: { some: { userId: 2, visibility: Visibility.PUBLIC } } },
        }),
      }),
    );
    expect(collectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 2, visibility: Visibility.PUBLIC } }),
    );
  });

  it('returns all content to the owner despite global privacy', async () => {
    const privateMovie = { id: 9, visibility: Visibility.PRIVATE };
    userFindUnique.mockResolvedValue({
      id: 2,
      username: 'bob',
      bio: null,
      contentVisibility: Visibility.PRIVATE,
      _count: { followers: 0, following: 0 },
    });
    topPickFindMany.mockResolvedValue([]);
    collectionFindMany.mockResolvedValue([]);
    getUserTitles
      .mockResolvedValueOnce([privateMovie])
      .mockResolvedValueOnce([]);

    await expect(service.getOwnProfile(2)).resolves.toMatchObject({ movies: [privateMovie] });
    expect(getUserTitles).toHaveBeenCalledWith(
      TitleType.MOVIE,
      2,
      expect.objectContaining({ visibility: undefined }),
    );
  });

  it('returns not found for an individually private public title', async () => {
    userFindUnique.mockResolvedValue({ id: 2, contentVisibility: Visibility.PUBLIC });
    getUserTitle.mockResolvedValue(null);

    await expect(service.getPublicTitle('bob', TitleType.MOVIE, 9)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(getUserTitle).toHaveBeenCalledWith(TitleType.MOVIE, 2, 9, Visibility.PUBLIC);
  });

  it('returns not found for collections behind global privacy', async () => {
    userFindUnique.mockResolvedValue({ id: 2, contentVisibility: Visibility.PRIVATE });

    await expect(service.getPublicCollection('bob', 4)).rejects.toBeInstanceOf(NotFoundException);
    expect(findPublicOne).not.toHaveBeenCalled();
  });

  it('preserves resource choices when global visibility changes', async () => {
    userUpdate.mockResolvedValue({ contentVisibility: Visibility.PRIVATE });

    await expect(service.updateSettings(2, { visibility: Visibility.PRIVATE })).resolves.toEqual({
      visibility: Visibility.PRIVATE,
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { contentVisibility: Visibility.PRIVATE },
      select: { contentVisibility: true },
    });
  });
});
