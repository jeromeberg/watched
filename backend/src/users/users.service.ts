import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TitleType, WatchStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { TitleListOptions, TitlesService } from '../titles/titles.service';
import { CollectionsService } from '../collections/collections.service';

const PROFILE_TITLES_LIMIT = 10;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private titlesService: TitlesService,
    private collectionsService: CollectionsService,
  ) {}

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        _count: { select: { followers: true, following: true } },
        topPicks: {
          orderBy: { rank: 'asc' },
          include: { title: true },
        },
        collections: {
          include: {
            _count: { select: { items: true } },
            items: {
              take: 5,
              orderBy: { addedAt: 'asc' },
              include: { title: { select: { posterUrl: true } } },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const [movies, shows] = await Promise.all([
      this.titlesService.getUserTitles(TitleType.MOVIE, user.id, {
        status: WatchStatus.WATCHED,
        limit: PROFILE_TITLES_LIMIT,
      }),
      this.titlesService.getUserTitles(TitleType.TV, user.id, {
        status: WatchStatus.WATCHED,
        limit: PROFILE_TITLES_LIMIT,
      }),
    ]);

    return {
      username: user.username,
      bio: user.bio,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      topPicks: user.topPicks.map((p) => ({ rank: p.rank, title: p.title })),
      movies,
      shows,
      collections: user.collections.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        itemCount: c._count.items,
        coverPosters: c.items.map((i) => i.title.posterUrl).filter((p): p is string => p !== null),
      })),
    };
  }

  /** List a profile's followers in newest-first order. */
  async getFollowers(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        followers: {
          orderBy: { createdAt: 'desc' },
          select: { follower: { select: { username: true, bio: true } } },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return user.followers.map(({ follower }) => follower);
  }

  /** List the profiles a user follows in newest-first order. */
  async getFollowing(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        following: {
          orderBy: { createdAt: 'desc' },
          select: { following: { select: { username: true, bio: true } } },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return user.following.map(({ following }) => following);
  }

  /** Check whether one user follows the profile identified by username. */
  async getFollowStatus(followerId: number, username: string) {
    const following = await this.findUserByUsernameOrThrow(username);
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: following.id } },
      select: { followerId: true },
    });

    return { isFollowing: follow !== null };
  }

  /** Create a follow relation unless it already exists. */
  async follow(followerId: number, username: string) {
    const following = await this.findUserByUsernameOrThrow(username);
    if (following.id === followerId) throw new BadRequestException('You cannot follow yourself');

    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId: following.id } },
      create: { followerId, followingId: following.id },
      update: {},
    });

    return { isFollowing: true };
  }

  /** Remove a follow relation if it exists. */
  async unfollow(followerId: number, username: string) {
    const following = await this.findUserByUsernameOrThrow(username);
    await this.prisma.follow.deleteMany({ where: { followerId, followingId: following.id } });

    return { isFollowing: false };
  }

  async getPublicCollection(username: string, collectionId: number) {
    const user = await this.findUserByUsernameOrThrow(username);
    return this.collectionsService.findOne(user.id, collectionId);
  }

  /** List public titles after resolving their owner. */
  async getPublicTitles(username: string, type: TitleType, opts: TitleListOptions) {
    const user = await this.findUserByUsernameOrThrow(username);
    return this.titlesService.getUserTitles(type, user.id, opts);
  }

  /** Return one public title after resolving its owner. */
  async getPublicTitle(username: string, type: TitleType, titleId: number) {
    const user = await this.findUserByUsernameOrThrow(username);
    return this.titlesService.getUserTitle(type, user.id, titleId);
  }

  /** Find a user by username or report that the public resource does not exist. */
  async findUserByUsernameOrThrow(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: number, bio?: string | null, topPicks?: number[]) {
    if (topPicks !== undefined) {
      if (topPicks.length > 5) throw new BadRequestException('Max 5 top picks');

      if (topPicks.length > 0) {
        const owned = await this.prisma.userTitle.findMany({
          where: { userId, titleId: { in: topPicks } },
          select: { titleId: true },
        });
        if (owned.length !== topPicks.length) {
          throw new BadRequestException('One or more titles not in your list');
        }
      }

      await this.prisma.$transaction([
        this.prisma.userTopPick.deleteMany({ where: { userId } }),
        ...topPicks.map((titleId, i) =>
          this.prisma.userTopPick.create({ data: { userId, titleId, rank: i + 1 } }),
        ),
      ]);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: bio !== undefined ? { bio } : {},
      select: { username: true, bio: true },
    });

    return user;
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { ok: true };
  }
}
