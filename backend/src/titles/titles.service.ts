import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { TitleType, WatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from '../tmdb/tmdb.service';

export interface AddTitleDto {
  tmdbId: number;
  title: string;
  posterUrl?: string | null;
  releaseYear?: number | null;
  director?: string | null;
  description?: string | null;
}

interface UpdateUserTitleDto {
  rating?: number | null;
  status?: WatchStatus;
  notes?: string | null;
}

export interface TitleListOptions {
  status?: WatchStatus;
  order?: 'rating' | 'added';
  limit?: number;
}

// validate query params ?status=&order=&limit=
// 400 on bad values
export function parseTitleListQuery(query: {
  status?: string;
  order?: string;
  limit?: string;
}): TitleListOptions {
  const opts: TitleListOptions = {};

  if (query.status !== undefined) {
    const status = query.status.toUpperCase();
    if (status !== WatchStatus.WATCHED && status !== WatchStatus.TO_WATCH) {
      throw new BadRequestException('status must be "watched" or "to_watch"');
    }
    opts.status = status;
  }

  if (query.order !== undefined) {
    if (query.order !== 'rating' && query.order !== 'added') {
      throw new BadRequestException('order must be "rating" or "added"');
    }
    opts.order = query.order;
  }

  if (query.limit !== undefined) {
    const limit = Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1) {
      throw new BadRequestException('limit must be a positive integer');
    }
    opts.limit = limit;
  }

  return opts;
}

// shared
@Injectable()
export class TitlesService {
  private readonly logger = new Logger(TitlesService.name);

  constructor(
    private prisma: PrismaService,
    private tmdb: TmdbService,
  ) {}

  search(type: TitleType, query: string) {
    return type === TitleType.MOVIE ? this.tmdb.searchMovies(query) : this.tmdb.searchTv(query);
  }

  async addTitle(type: TitleType, userId: number, dto: AddTitleDto) {
    let imdbId: string | null = null;
    try {
      imdbId =
        type === TitleType.MOVIE
          ? await this.tmdb.getMovieImdbId(dto.tmdbId)
          : await this.tmdb.getTvImdbId(dto.tmdbId);
    } catch (err) {
      this.logger.warn(`Failed to fetch IMDb id for tmdbId=${dto.tmdbId} type=${type}: ${err}`);
    }

    const title = await this.prisma.title.upsert({
      where: { tmdbId_type: { tmdbId: dto.tmdbId, type } },
      create: {
        tmdbId: dto.tmdbId,
        type,
        title: dto.title,
        posterUrl: dto.posterUrl ?? null,
        releaseYear: dto.releaseYear ?? null,
        imdbId,
        director: dto.director ?? null,
        description: dto.description ?? null,
      },
      update: {
        ...(imdbId ? { imdbId } : {}),
        ...(dto.director ? { director: dto.director } : {}),
        ...(dto.description ? { description: dto.description } : {}),
      },
    });

    const userTitle = await this.prisma.userTitle.upsert({
      where: { userId_titleId: { userId, titleId: title.id } },
      create: { userId, titleId: title.id },
      update: {},
    });

    return this.mergeUserTitle({ ...userTitle, title });
  }

  async getUserTitles(type: TitleType, userId: number, opts: TitleListOptions = {}) {
    const rows = await this.prisma.userTitle.findMany({
      where: {
        userId,
        title: { type },
        ...(opts.status && { status: opts.status }),
      },
      include: { title: true },
      orderBy: opts.order === 'rating' ? { rating: { sort: 'desc', nulls: 'last' } } : { addedAt: 'desc' },
      ...(opts.limit && { take: opts.limit }),
    });
    return rows.map((r) => this.mergeUserTitle(r));
  }

  async getUserTitle(type: TitleType, userId: number, titleId: number) {
    const row = await this.prisma.userTitle.findUnique({
      where: { userId_titleId: { userId, titleId } },
      include: { title: true },
    });
    if (!row || row.title.type !== type) return null;
    return this.mergeUserTitle(row);
  }

  async getPublicUserTitles(type: TitleType, username: string, opts: TitleListOptions = {}) {
    const user = await this.prisma.findUserByUsernameOrThrow(username);
    return this.getPublicUserTitlesByUserId(type, user.id, opts);
  }

  async getPublicUserTitlesByUserId(type: TitleType, userId: number, opts: TitleListOptions = {}) {
    return this.getUserTitles(type, userId, opts);
  }

  async getPublicUserTitle(type: TitleType, username: string, titleId: number) {
    const user = await this.prisma.findUserByUsernameOrThrow(username);
    return this.getUserTitle(type, user.id, titleId);
  }

  async updateUserTitle(userId: number, titleId: number, updates: UpdateUserTitleDto) {
    if (updates.rating !== undefined && updates.rating !== null) {
      if (!Number.isInteger(updates.rating) || updates.rating < 1 || updates.rating > 10) {
        throw new BadRequestException('Rating must be between 1 and 10');
      }
    }

    const userTitle = await this.prisma.userTitle.findUnique({
      where: { userId_titleId: { userId, titleId } },
    });
    if (!userTitle) throw new NotFoundException('Title not in your list');

    const data: Record<string, unknown> = {};
    if ('rating' in updates) data.rating = updates.rating;
    if ('status' in updates) data.status = updates.status;
    if ('notes' in updates) data.notes = updates.notes;

    return this.prisma.userTitle.update({
      where: { userId_titleId: { userId, titleId } },
      data,
    });
  }

  async removeUserTitle(userId: number, titleId: number) {
    const userTitle = await this.prisma.userTitle.findUnique({
      where: { userId_titleId: { userId, titleId } },
    });
    if (!userTitle) throw new NotFoundException('Title not in your list');

    await this.prisma.userTitle.delete({
      where: { userId_titleId: { userId, titleId } },
    });
    return { ok: true };
  }

  private mergeUserTitle(row: {
    title: {
      id: number;
      tmdbId: number;
      type: TitleType;
      title: string;
      posterUrl: string | null;
      releaseYear: number | null;
      imdbId: string | null;
      director: string | null;
      description: string | null;
    };
    addedAt: Date;
    rating: number | null;
    status: WatchStatus;
    notes: string | null;
  }) {
    return { ...row.title, addedAt: row.addedAt, rating: row.rating, status: row.status, notes: row.notes };
  }
}
