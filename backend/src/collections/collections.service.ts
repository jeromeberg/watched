import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, Prisma, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class CollectionsService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async create(
    userId: number,
    name: string,
    description?: string,
    visibility: Visibility = Visibility.PUBLIC,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const collection = await tx.collection.create({
        data: { userId, name, description: description ?? null, visibility },
      });
      await this.activityService.recordCollection(tx, userId, collection.id, ActivityType.COLLECTION_CREATED);
      return collection;
    });
  }

  async findAll(userId: number, titleId?: number) {
    const collections = await this.prisma.collection.findMany({
      where: { userId },
      include: {
        _count: { select: { items: true } },
        items: {
          take: 4,
          orderBy: { addedAt: 'asc' },
          include: { title: { select: { posterUrl: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let hasTitleSet = new Set<number>();
    if (titleId !== undefined && collections.length > 0) {
      const matches = await this.prisma.collectionItem.findMany({
        where: { titleId, collectionId: { in: collections.map((c) => c.id) } },
        select: { collectionId: true },
      });
      hasTitleSet = new Set(matches.map((m) => m.collectionId));
    }

    return collections.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      visibility: c.visibility,
      createdAt: c.createdAt,
      itemCount: c._count.items,
      coverPosters: c.items.map((i) => i.title.posterUrl).filter((p): p is string => p !== null),
      ...(titleId !== undefined && { hasTitle: hasTitleSet.has(c.id) }),
    }));
  }

  async findOne(userId: number, id: number) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: { title: { include: { userTitles: { where: { userId } } } } },
          orderBy: { addedAt: 'desc' },
        },
      },
    });
    if (!collection) throw new NotFoundException('Collection not found');

    return {
      ...collection,
      items: collection.items.map((item) => {
        const { userTitles, ...title } = item.title;
        const userTitle = userTitles[0];
        return {
          collectionId: item.collectionId,
          titleId: item.titleId,
          addedAt: item.addedAt,
          title: {
            ...title,
            rating: userTitle?.rating ?? null,
            status: userTitle?.status ?? 'TO_WATCH',
            notes: userTitle?.notes ?? null,
            visibility: userTitle?.visibility ?? Visibility.PUBLIC,
          },
        };
      }),
    };
  }

  /** Return one publicly visible collection with only its publicly visible titles. */
  async findPublicOne(userId: number, id: number) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, userId, visibility: Visibility.PUBLIC },
      include: {
        items: {
          where: {
            title: {
              userTitles: { some: { userId, visibility: Visibility.PUBLIC } },
            },
          },
          include: {
            title: {
              include: {
                userTitles: { where: { userId, visibility: Visibility.PUBLIC } },
              },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
      },
    });
    if (!collection) throw new NotFoundException('Collection not found');

    return {
      ...collection,
      items: collection.items.map((item) => {
        const { userTitles, ...title } = item.title;
        const userTitle = userTitles[0];
        if (!userTitle) throw new NotFoundException('Title not found');
        return {
          collectionId: item.collectionId,
          titleId: item.titleId,
          addedAt: item.addedAt,
          title: {
            ...title,
            rating: userTitle.rating,
            status: userTitle.status,
            notes: userTitle.notes,
            visibility: userTitle.visibility,
          },
        };
      }),
    };
  }

  async update(
    userId: number,
    id: number,
    name?: string,
    description?: string | null,
    visibility?: Visibility,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await this.findOwnedCollection(tx, userId, id);
      const nameChanged = name !== undefined && name !== current.name;
      const descriptionChanged = description !== undefined && description !== current.description;
      const visibilityChanged = visibility !== undefined && visibility !== current.visibility;
      if (!nameChanged && !descriptionChanged && !visibilityChanged) return current;

      const collection = await tx.collection.update({
        where: { id },
        data: {
          ...(nameChanged && { name }),
          ...(descriptionChanged && { description }),
          ...(visibilityChanged && { visibility }),
        },
      });
      if (nameChanged || descriptionChanged) {
        await this.activityService.recordCollection(tx, userId, id, ActivityType.COLLECTION_UPDATED, {
          changedFields: [...(nameChanged ? ['name'] : []), ...(descriptionChanged ? ['description'] : [])],
        });
      }
      return collection;
    });
  }

  async remove(userId: number, id: number) {
    await this.assertOwner(userId, id);
    await this.prisma.collection.delete({ where: { id } });
    return { ok: true };
  }

  async addItem(userId: number, collectionId: number, titleId: number) {
    return this.prisma.$transaction(async (tx) => {
      await this.findOwnedCollection(tx, userId, collectionId);
      const userTitle = await tx.userTitle.findUnique({
        where: { userId_titleId: { userId, titleId } },
      });
      if (!userTitle) throw new BadRequestException('Title is not in your library');

      const { count } = await tx.collectionItem.createMany({
        data: { collectionId, titleId },
        skipDuplicates: true,
      });
      const item = await tx.collectionItem.findUniqueOrThrow({
        where: { collectionId_titleId: { collectionId, titleId } },
      });
      if (count > 0) {
        await this.activityService.recordCollectionItem(
          tx,
          userId,
          collectionId,
          titleId,
          ActivityType.COLLECTION_ITEM_ADDED,
        );
      }
      return item;
    });
  }

  async removeItem(userId: number, collectionId: number, titleId: number) {
    return this.prisma.$transaction(async (tx) => {
      await this.findOwnedCollection(tx, userId, collectionId);
      const { count } = await tx.collectionItem.deleteMany({ where: { collectionId, titleId } });
      if (count > 0) {
        await this.activityService.recordCollectionItem(
          tx,
          userId,
          collectionId,
          titleId,
          ActivityType.COLLECTION_ITEM_REMOVED,
        );
      }
      return { ok: true };
    });
  }

  /** Return one collection owned by the user or report it as missing. */
  private async findOwnedCollection(
    client: Pick<Prisma.TransactionClient, 'collection'>,
    userId: number,
    collectionId: number,
  ) {
    const collection = await client.collection.findFirst({ where: { id: collectionId, userId } });
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  private async assertOwner(userId: number, collectionId: number) {
    const c = await this.prisma.collection.findFirst({ where: { id: collectionId, userId } });
    if (!c) throw new NotFoundException('Collection not found');
  }
}
