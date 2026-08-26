import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CollectionsService } from './collections.service';

/** Build the Prisma calls required by collection service tests. */
function createPrisma() {
  return {
    collection: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    collectionItem: {
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
    userTitle: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;
}

describe('CollectionsService', () => {
  it('rejects a title outside the requesting user library', async () => {
    const prisma = createPrisma();
    prisma.collection.findFirst = jest.fn().mockResolvedValue({ id: 4, userId: 1 });
    prisma.userTitle.findUnique = jest.fn().mockResolvedValue(null);
    const service = new CollectionsService(prisma);

    await expect(service.addItem(1, 4, 9)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.collectionItem.upsert).not.toHaveBeenCalled();
  });

  it('adds a title in the requesting user library', async () => {
    const prisma = createPrisma();
    prisma.collection.findFirst = jest.fn().mockResolvedValue({ id: 4, userId: 1 });
    prisma.userTitle.findUnique = jest.fn().mockResolvedValue({ userId: 1, titleId: 9 });
    prisma.collectionItem.upsert = jest.fn().mockResolvedValue({ collectionId: 4, titleId: 9 });
    const service = new CollectionsService(prisma);

    await expect(service.addItem(1, 4, 9)).resolves.toEqual({ collectionId: 4, titleId: 9 });
    expect(prisma.userTitle.findUnique).toHaveBeenCalledWith({
      where: { userId_titleId: { userId: 1, titleId: 9 } },
    });
  });

  it('deletes a collection without manually deleting its items', async () => {
    const prisma = createPrisma();
    prisma.collection.findFirst = jest.fn().mockResolvedValue({ id: 4, userId: 1 });
    prisma.collection.delete = jest.fn().mockResolvedValue({ id: 4 });
    const service = new CollectionsService(prisma);

    await expect(service.remove(1, 4)).resolves.toEqual({ ok: true });
    expect(prisma.collection.delete).toHaveBeenCalledWith({ where: { id: 4 } });
    expect(prisma.collectionItem.deleteMany).not.toHaveBeenCalled();
  });
});
