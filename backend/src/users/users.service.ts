import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TitleType, WatchStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { TitlesService } from '../titles/titles.service';
import { ShowsService } from '../shows/shows.service';
import { CollectionsService } from '../collections/collections.service';

const PROFILE_TITLES_LIMIT = 10;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private titlesService: TitlesService,
    private showsService: ShowsService,
    private collectionsService: CollectionsService,
  ) {}

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
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
      this.titlesService.getPublicUserTitlesByUserId(TitleType.MOVIE, user.id, {
        status: WatchStatus.WATCHED,
        limit: PROFILE_TITLES_LIMIT,
      }),
      this.titlesService.getPublicUserTitlesByUserId(TitleType.TV, user.id, {
        status: WatchStatus.WATCHED,
        limit: PROFILE_TITLES_LIMIT,
      }),
    ]);

    return {
      username: user.username,
      bio: user.bio,
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

  async getPublicCollection(username: string, collectionId: number) {
    const user = await this.prisma.findUserByUsernameOrThrow(username);
    return this.collectionsService.findOne(user.id, collectionId);
  }

  async getPublicEpisodes(username: string, titleId: number) {
    const user = await this.prisma.findUserByUsernameOrThrow(username);
    return this.showsService.getEpisodes(titleId, user.id);
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
