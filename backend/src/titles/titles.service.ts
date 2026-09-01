import { Injectable, NotFoundException } from '@nestjs/common';
import { TitleType, Visibility, WatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from '../tmdb/tmdb.service';
import { AddTitleDto } from './dto/add-title.dto';
import { UpdateUserTitleDto } from './dto/update-user-title.dto';

export interface TitleListOptions {
  status?: WatchStatus;
  order?: 'rating' | 'added';
  limit?: number;
  visibility?: Visibility;
}

// validate query params ?status=&order=&limit=
// 400 on bad values
// shared
@Injectable()
export class TitlesService {
  constructor(
    private prisma: PrismaService,
    private tmdb: TmdbService,
  ) {}

  search(type: TitleType, query: string) {
    return type === TitleType.MOVIE ? this.tmdb.searchMovies(query) : this.tmdb.searchTv(query);
  }

  async addTitle(type: TitleType, userId: number, dto: AddTitleDto) {
    const metadata =
      type === TitleType.MOVIE
        ? await this.tmdb.getMovieDetails(dto.tmdbId)
        : await this.tmdb.getTvDetails(dto.tmdbId);

    const title = await this.prisma.title.upsert({
      where: { tmdbId_type: { tmdbId: dto.tmdbId, type } },
      create: {
        tmdbId: metadata.tmdbId,
        type,
        title: metadata.title,
        posterUrl: metadata.posterUrl,
        releaseYear: metadata.releaseYear,
        imdbId: metadata.imdbId,
        director: metadata.director,
        description: metadata.description,
      },
      update: {
        title: metadata.title,
        posterUrl: metadata.posterUrl,
        releaseYear: metadata.releaseYear,
        imdbId: metadata.imdbId,
        director: metadata.director,
        description: metadata.description,
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
        ...(opts.visibility && { visibility: opts.visibility }),
      },
      include: { title: true },
      orderBy: opts.order === 'rating' ? { rating: { sort: 'desc', nulls: 'last' } } : { addedAt: 'desc' },
      ...(opts.limit && { take: opts.limit }),
    });
    return rows.map((r) => this.mergeUserTitle(r));
  }

  async getUserTitle(type: TitleType, userId: number, titleId: number, visibility?: Visibility) {
    const row = await this.prisma.userTitle.findUnique({
      where: { userId_titleId: { userId, titleId } },
      include: { title: true },
    });
    if (!row || row.title.type !== type || (visibility && row.visibility !== visibility)) return null;
    return this.mergeUserTitle(row);
  }

  async updateUserTitle(userId: number, titleId: number, updates: UpdateUserTitleDto) {
    const userTitle = await this.prisma.userTitle.findUnique({
      where: { userId_titleId: { userId, titleId } },
    });
    if (!userTitle) throw new NotFoundException('Title not in your list');

    const data: Record<string, unknown> = {};
    if ('rating' in updates) data.rating = updates.rating;
    if ('status' in updates) data.status = updates.status;
    if ('notes' in updates) data.notes = updates.notes;
    if ('visibility' in updates) data.visibility = updates.visibility;

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
    visibility: Visibility;
  }) {
    return {
      ...row.title,
      addedAt: row.addedAt,
      rating: row.rating,
      status: row.status,
      notes: row.notes,
      visibility: row.visibility,
    };
  }
}
