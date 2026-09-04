import { Injectable } from '@nestjs/common';
import { ActivityType, Prisma, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ACTIVITY_POLICY, ActivitySubject, shownActivityTypes } from './activity-policy';

const DEFAULT_FEED_LIMIT = 20;

type ActivityClient = Pick<Prisma.TransactionClient, 'activity' | 'collection' | 'user' | 'userTitle'>;

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  /** Record a title activity when the actor and title are public. */
  async recordTitle(
    client: ActivityClient,
    actorId: number,
    titleId: number,
    type: ActivityType,
    payload?: Prisma.InputJsonValue,
    replaceExisting = false,
  ) {
    if (replaceExisting) {
      await this.removeTitle(client, actorId, titleId, type);
    }
    if (!ACTIVITY_POLICY[type].record) return;

    const [actor, userTitle] = await Promise.all([
      client.user.findUnique({ where: { id: actorId }, select: { contentVisibility: true } }),
      client.userTitle.findUnique({
        where: { userId_titleId: { userId: actorId, titleId } },
        select: { visibility: true },
      }),
    ]);
    if (actor?.contentVisibility !== Visibility.PUBLIC || userTitle?.visibility !== Visibility.PUBLIC) return;

    return client.activity.create({
      data: {
        actorId,
        type,
        userTitleUserId: actorId,
        userTitleTitleId: titleId,
        ...(payload !== undefined && { payload }),
      },
    });
  }

  /** Remove one mutable title activity from the feed history. */
  removeTitle(client: ActivityClient, actorId: number, titleId: number, type: ActivityType) {
    return client.activity.deleteMany({
      where: { actorId, type, userTitleUserId: actorId, userTitleTitleId: titleId },
    });
  }

  /** Record a collection activity when the actor and collection are public. */
  async recordCollection(
    client: ActivityClient,
    actorId: number,
    collectionId: number,
    type: ActivityType,
    payload?: Prisma.InputJsonValue,
  ) {
    if (!ACTIVITY_POLICY[type].record) return;

    const [actor, collection] = await Promise.all([
      client.user.findUnique({ where: { id: actorId }, select: { contentVisibility: true } }),
      client.collection.findFirst({
        where: { id: collectionId, userId: actorId },
        select: { visibility: true },
      }),
    ]);
    if (actor?.contentVisibility !== Visibility.PUBLIC || collection?.visibility !== Visibility.PUBLIC)
      return;

    return client.activity.create({
      data: {
        actorId,
        type,
        collectionId,
        ...(payload !== undefined && { payload }),
      },
    });
  }

  /** Record a collection-item activity when every referenced resource is public. */
  async recordCollectionItem(
    client: ActivityClient,
    actorId: number,
    collectionId: number,
    titleId: number,
    type: ActivityType,
  ) {
    if (!ACTIVITY_POLICY[type].record) return;

    const [actor, collection, userTitle] = await Promise.all([
      client.user.findUnique({ where: { id: actorId }, select: { contentVisibility: true } }),
      client.collection.findFirst({
        where: { id: collectionId, userId: actorId },
        select: { visibility: true },
      }),
      client.userTitle.findUnique({
        where: { userId_titleId: { userId: actorId, titleId } },
        select: { visibility: true },
      }),
    ]);
    if (
      actor?.contentVisibility !== Visibility.PUBLIC ||
      collection?.visibility !== Visibility.PUBLIC ||
      userTitle?.visibility !== Visibility.PUBLIC
    ) {
      return;
    }

    return client.activity.create({
      data: {
        actorId,
        type,
        userTitleUserId: actorId,
        userTitleTitleId: titleId,
        collectionId,
      },
    });
  }

  /** Return followed-user activities that remain publicly visible. */
  async getFeed(userId: number, cursor?: number, requestedLimit?: number) {
    const limit = requestedLimit ?? DEFAULT_FEED_LIMIT;
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followedIds = follows.map(({ followingId }) => followingId);
    if (followedIds.length === 0) return { items: [], nextCursor: null, hasFollowing: false };

    const subjectFilters = this.feedSubjectFilters();
    if (subjectFilters.length === 0) return { items: [], nextCursor: null, hasFollowing: true };

    const rows = await this.prisma.activity.findMany({
      where: {
        actorId: { in: followedIds },
        actor: { contentVisibility: Visibility.PUBLIC },
        ...(cursor !== undefined && { id: { lt: cursor } }),
        OR: subjectFilters,
      },
      include: {
        actor: { select: { username: true } },
        userTitle: { include: { title: true } },
        collection: { select: { id: true, name: true, description: true } },
      },
      orderBy: { id: 'desc' },
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const items = page.map((activity) => ({
      id: activity.id,
      type: activity.type,
      createdAt: activity.createdAt,
      actor: activity.actor,
      payload: activity.payload,
      title: activity.userTitle
        ? {
            id: activity.userTitle.title.id,
            type: activity.userTitle.title.type,
            title: activity.userTitle.title.title,
            posterUrl: activity.userTitle.title.posterUrl,
            releaseYear: activity.userTitle.title.releaseYear,
          }
        : null,
      collection: activity.collection,
    }));

    return {
      items,
      nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
      hasFollowing: true,
    };
  }

  /** Build visibility filters for every activity subject enabled in the feed. */
  private feedSubjectFilters(): Prisma.ActivityWhereInput[] {
    const filters: Prisma.ActivityWhereInput[] = [];
    this.addSubjectFilter(filters, 'title', {
      userTitle: { is: { visibility: Visibility.PUBLIC } },
    });
    this.addSubjectFilter(filters, 'collection', {
      collection: { is: { visibility: Visibility.PUBLIC } },
    });
    this.addSubjectFilter(filters, 'collectionItem', {
      userTitle: { is: { visibility: Visibility.PUBLIC } },
      collection: { is: { visibility: Visibility.PUBLIC } },
    });
    return filters;
  }

  /** Add a subject filter only when at least one matching type is visible. */
  private addSubjectFilter(
    filters: Prisma.ActivityWhereInput[],
    subject: ActivitySubject,
    visibility: Prisma.ActivityWhereInput,
  ) {
    const types = shownActivityTypes(subject);
    if (types.length > 0) filters.push({ type: { in: types }, ...visibility });
  }
}
