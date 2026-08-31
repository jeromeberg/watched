import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TitlesService } from '../titles/titles.service';
import { CollectionsService } from '../collections/collections.service';
import { UsersService } from './users.service';

describe('UsersService follows', () => {
  const userFindUnique = jest.fn();
  const followFindUnique = jest.fn();
  const followUpsert = jest.fn();
  const followDeleteMany = jest.fn();
  const prisma = {
    user: { findUnique: userFindUnique },
    follow: {
      findUnique: followFindUnique,
      upsert: followUpsert,
      deleteMany: followDeleteMany,
    },
  } as unknown as PrismaService;
  const service = new UsersService(prisma, {} as TitlesService, {} as CollectionsService);

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
});
