import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EpisodesService {
  constructor(private prisma: PrismaService) {}

  async markWatched(userId: number, episodeId: number) {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throw new NotFoundException('Episode not found');

    return this.prisma.episodeWatch.upsert({
      where: { userId_episodeId: { userId, episodeId } },
      create: { userId, episodeId },
      update: {},
    });
  }

  async unmarkWatched(userId: number, episodeId: number) {
    await this.prisma.episodeWatch.deleteMany({ where: { userId, episodeId } });
    return { ok: true };
  }
}
