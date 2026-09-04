import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma, User } from '@prisma/client';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

const DEMO_SOURCE_USERNAME = 'demo';
const DEMO_TTL_HOURS = 24;
const DEMO_TOKEN_EXPIRES_IN = '24h';
const MAX_LIVE_DEMO_ACCOUNTS = 200;
const USERNAME_ATTEMPTS = 5;

type PrismaTransaction = Prisma.TransactionClient;

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  /**
   * Creates a throwaway account seeded from the curated demo library.
   *
   * The new account copies the source account's titles, top picks and
   * collections, then follows it. A missing source account yields an empty
   * account rather than an error, so demo mode never hard-fails.
   *
   * @return A signed token plus the generated username and expiry.
   */
  async createDemoAccount() {
    await this.assertCapacityAvailable();

    const user = await this.createTemporaryUser();
    const source = await this.prisma.user.findUnique({
      where: { username: DEMO_SOURCE_USERNAME },
      select: { id: true },
    });

    if (source) await this.seedFromSource(user.id, source.id);

    return {
      ...this.authService.issueToken(user, DEMO_TOKEN_EXPIRES_IN),
      username: user.username,
      expiresAt: user.expiresAt,
    };
  }

  /** Delete demo accounts whose 24h lifetime has run out. */
  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredDemoAccounts() {
    const { count } = await this.prisma.user.deleteMany({
      where: { isDemo: true, expiresAt: { lt: new Date() } },
    });
    if (count > 0) this.logger.log(`Purged ${count} expired demo account(s)`);
    return { count };
  }

  /** Refuse new demo accounts once too many are still live. */
  private async assertCapacityAvailable() {
    const live = await this.prisma.user.count({
      where: { isDemo: true, expiresAt: { gte: new Date() } },
    });
    if (live >= MAX_LIVE_DEMO_ACCOUNTS) {
      throw new ServiceUnavailableException('Demo mode is busy, try again later');
    }
  }

  /**
   * Creates the temporary user row, retrying on username collisions.
   *
   * @return The persisted demo user.
   */
  private async createTemporaryUser(): Promise<User> {
    const passwordHash = await bcrypt.hash(randomBytes(24).toString('hex'), 10);
    const expiresAt = new Date(Date.now() + DEMO_TTL_HOURS * 60 * 60 * 1000);

    for (let attempt = 0; attempt < USERNAME_ATTEMPTS; attempt++) {
      try {
        return await this.prisma.user.create({
          data: {
            username: `${DEMO_SOURCE_USERNAME}-${randomBytes(4).toString('hex')}`,
            passwordHash,
            isDemo: true,
            expiresAt,
          },
        });
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;
      }
    }

    throw new ServiceUnavailableException('Could not create a demo account');
  }

  /** Copy the source library and follow the source account in one transaction. */
  private seedFromSource(userId: number, sourceId: number) {
    return this.prisma.$transaction(async (tx) => {
      await this.copyTitles(tx, userId, sourceId);
      await this.copyTopPicks(tx, userId, sourceId);
      await this.copyCollections(tx, userId, sourceId);
      await tx.follow.create({ data: { followerId: userId, followingId: sourceId } });
    });
  }

  /** Duplicate the source library entries against the same shared titles. */
  private async copyTitles(tx: PrismaTransaction, userId: number, sourceId: number) {
    const titles = await tx.userTitle.findMany({
      where: { userId: sourceId },
      select: { titleId: true, rating: true, status: true, notes: true, visibility: true },
    });
    if (titles.length === 0) return;

    await tx.userTitle.createMany({ data: titles.map((title) => ({ ...title, userId })) });
  }

  /** Duplicate the source profile's ranked top picks. */
  private async copyTopPicks(tx: PrismaTransaction, userId: number, sourceId: number) {
    const picks = await tx.userTopPick.findMany({
      where: { userId: sourceId },
      select: { titleId: true, rank: true },
    });
    if (picks.length === 0) return;

    await tx.userTopPick.createMany({ data: picks.map((pick) => ({ ...pick, userId })) });
  }

  /** Duplicate the source collections along with their items. */
  private async copyCollections(tx: PrismaTransaction, userId: number, sourceId: number) {
    const collections = await tx.collection.findMany({
      where: { userId: sourceId },
      select: {
        name: true,
        description: true,
        visibility: true,
        items: { select: { titleId: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const { items, ...collection } of collections) {
      const created = await tx.collection.create({ data: { ...collection, userId } });
      if (items.length === 0) continue;

      await tx.collectionItem.createMany({
        data: items.map((item) => ({ collectionId: created.id, titleId: item.titleId })),
      });
    }
  }
}

/** Check if a Prisma error reports a duplicate unique value. */
function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
