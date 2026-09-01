import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Prisma, TitleType, Visibility, WatchStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { TitleListOptions, TitlesService } from '../titles/titles.service';
import { CollectionsService } from '../collections/collections.service';
import { UpdateSettingsDto } from './dto/settings.dto';

const PROFILE_TITLES_LIMIT = 10;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private titlesService: TitlesService,
    private collectionsService: CollectionsService,
  ) {}

  /** Return a profile with only content visible to other users. */
  getPublicProfile(username: string) {
    return this.getProfile({ username }, false);
  }

  /** Return the signed-in user's profile without applying visibility filters. */
  getOwnProfile(userId: number) {
    return this.getProfile({ id: userId }, true);
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
    this.assertContentIsPublic(user.contentVisibility);
    return this.collectionsService.findPublicOne(user.id, collectionId);
  }

  /** List public titles after resolving their owner. */
  async getPublicTitles(username: string, type: TitleType, opts: TitleListOptions) {
    const user = await this.findUserByUsernameOrThrow(username);
    if (user.contentVisibility === Visibility.PRIVATE) return [];
    return this.titlesService.getUserTitles(type, user.id, {
      ...opts,
      visibility: Visibility.PUBLIC,
    });
  }

  /** Return one public title after resolving its owner. */
  async getPublicTitle(username: string, type: TitleType, titleId: number) {
    const user = await this.findUserByUsernameOrThrow(username);
    this.assertContentIsPublic(user.contentVisibility);
    const title = await this.titlesService.getUserTitle(type, user.id, titleId, Visibility.PUBLIC);
    if (!title) throw new NotFoundException('Title not found');
    return title;
  }

  /** Find a user by username or report that the public resource does not exist. */
  async findUserByUsernameOrThrow(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Return the signed-in user's global content visibility. */
  async getSettings(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { contentVisibility: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return { visibility: user.contentVisibility };
  }

  /** Update the signed-in user's global content visibility. */
  async updateSettings(userId: number, settings: UpdateSettingsDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { contentVisibility: settings.visibility },
      select: { contentVisibility: true },
    });
    return { visibility: user.contentVisibility };
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

  /** Build one profile while applying the requested visibility policy. */
  private async getProfile(where: Prisma.UserWhereUniqueInput, includePrivate: boolean) {
    const user = await this.prisma.user.findUnique({
      where,
      include: { _count: { select: { followers: true, following: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    const contentIsVisible = includePrivate || user.contentVisibility === Visibility.PUBLIC;
    if (!contentIsVisible) {
      return {
        username: user.username,
        bio: user.bio,
        contentVisibility: user.contentVisibility,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        topPicks: [],
        movies: [],
        shows: [],
        collections: [],
      };
    }

    const publicTitleWhere = {
      title: { userTitles: { some: { userId: user.id, visibility: Visibility.PUBLIC } } },
    };
    const publicItemWhere = {
      title: { userTitles: { some: { userId: user.id, visibility: Visibility.PUBLIC } } },
    };
    const titleVisibility = includePrivate ? undefined : Visibility.PUBLIC;

    const [topPicks, movies, shows, collections] = await Promise.all([
      this.prisma.userTopPick.findMany({
        where: { userId: user.id, ...(!includePrivate && publicTitleWhere) },
        orderBy: { rank: 'asc' },
        include: { title: true },
      }),
      this.titlesService.getUserTitles(TitleType.MOVIE, user.id, {
        status: WatchStatus.WATCHED,
        limit: PROFILE_TITLES_LIMIT,
        visibility: titleVisibility,
      }),
      this.titlesService.getUserTitles(TitleType.TV, user.id, {
        status: WatchStatus.WATCHED,
        limit: PROFILE_TITLES_LIMIT,
        visibility: titleVisibility,
      }),
      this.prisma.collection.findMany({
        where: {
          userId: user.id,
          ...(!includePrivate && { visibility: Visibility.PUBLIC }),
        },
        include: {
          _count: {
            select: { items: includePrivate ? true : { where: publicItemWhere } },
          },
          items: {
            ...(!includePrivate && { where: publicItemWhere }),
            take: 5,
            orderBy: { addedAt: 'asc' },
            include: { title: { select: { posterUrl: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      username: user.username,
      bio: user.bio,
      contentVisibility: user.contentVisibility,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      topPicks: topPicks.map((pick) => ({ rank: pick.rank, title: pick.title })),
      movies,
      shows,
      collections: collections.map((collection) => ({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        visibility: collection.visibility,
        itemCount: collection._count.items,
        coverPosters: collection.items
          .map((item) => item.title.posterUrl)
          .filter((poster): poster is string => poster !== null),
      })),
    };
  }

  /** Hide globally private content behind the same response as a missing resource. */
  private assertContentIsPublic(visibility: Visibility) {
    if (visibility === Visibility.PRIVATE) throw new NotFoundException('Content not found');
  }
}
