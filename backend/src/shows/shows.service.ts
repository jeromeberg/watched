import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from '../tmdb/tmdb.service';

@Injectable()
export class ShowsService {
  constructor(
    private prisma: PrismaService,
    private tmdb: TmdbService,
  ) {}

  async getProgress(userId: number, showId: number) {
    const seasons = await this.prisma.season.findMany({
      where: { showId },
      include: {
        episodes: {
          include: { watches: { where: { userId } } },
          orderBy: { episodeNumber: 'asc' },
        },
      },
      orderBy: { seasonNumber: 'asc' },
    });

    return seasons.map((s) => ({
      seasonNumber: s.seasonNumber,
      name: s.name,
      total: s.episodes.length,
      watched: s.episodes.filter((ep) => ep.watches.length > 0).length,
    }));
  }

  async getEpisodes(titleId: number, userId: number) {
    const withWatched = (seasons: typeof cached) =>
      seasons.map((s) => ({
        ...s,
        episodes: s.episodes.map((ep) => ({
          id: ep.id,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          airDate: ep.airDate,
          watched: ep.watches.length > 0,
        })),
      }));

    const cached = await this.prisma.season.findMany({
      where: { showId: titleId },
      include: {
        episodes: { include: { watches: { where: { userId } } }, orderBy: { episodeNumber: 'asc' } },
      },
      orderBy: { seasonNumber: 'asc' },
    });
    if (cached.length > 0) return withWatched(cached);

    const show = await this.prisma.title.findUnique({ where: { id: titleId } });
    if (!show) throw new NotFoundException('Show not found');

    const tmdbSeasons = await this.tmdb.getTvSeasons(show.tmdbId);
    const result = [];

    for (const s of tmdbSeasons) {
      const tmdbEpisodes = await this.tmdb.getSeasonEpisodes(show.tmdbId, s.season_number);
      const season = await this.prisma.season.create({
        data: {
          showId: titleId,
          seasonNumber: s.season_number,
          name: s.name || null,
          episodes: {
            create: tmdbEpisodes.map((ep) => ({
              episodeNumber: ep.episode_number,
              title: ep.name,
              airDate: ep.air_date || null,
            })),
          },
        },
        include: { episodes: { orderBy: { episodeNumber: 'asc' } } },
      });
      result.push({
        ...season,
        episodes: season.episodes.map((ep) => ({
          id: ep.id,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          airDate: ep.airDate,
          watched: false,
        })),
      });
    }

    return result;
  }
}
