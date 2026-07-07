import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, name: string, description?: string) {
    return this.prisma.collection.create({
      data: { userId, name, description: description ?? null },
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
          },
        };
      }),
    };
  }

  async update(userId: number, id: number, name?: string, description?: string | null) {
    await this.assertOwner(userId, id);
    return this.prisma.collection.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    });
  }

  async remove(userId: number, id: number) {
    await this.assertOwner(userId, id);
    await this.prisma.collectionItem.deleteMany({ where: { collectionId: id } });
    await this.prisma.collection.delete({ where: { id } });
    return { ok: true };
  }

  async addItem(userId: number, collectionId: number, titleId: number) {
    await this.assertOwner(userId, collectionId);
    return this.prisma.collectionItem.upsert({
      where: { collectionId_titleId: { collectionId, titleId } },
      create: { collectionId, titleId },
      update: {},
    });
  }

  async removeItem(userId: number, collectionId: number, titleId: number) {
    await this.assertOwner(userId, collectionId);
    await this.prisma.collectionItem.deleteMany({ where: { collectionId, titleId } });
    return { ok: true };
  }

  private async assertOwner(userId: number, collectionId: number) {
    const c = await this.prisma.collection.findFirst({ where: { id: collectionId, userId } });
    if (!c) throw new NotFoundException('Collection not found');
  }
}
