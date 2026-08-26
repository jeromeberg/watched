import { Body, Get, Param, ParseIntPipe, Post, Query, Req } from '@nestjs/common';
import { TitleType } from '@prisma/client';
import { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { AddTitleDto } from './dto/add-title.dto';
import { SearchTitlesQueryDto } from './dto/search-titles-query.dto';
import { TitleListQueryDto } from './dto/title-list-query.dto';
import { TitlesService } from './titles.service';

/** Provide authenticated routes for one configured title type. */
export abstract class TitleLibraryController {
  constructor(
    private readonly titlesService: TitlesService,
    private readonly titleType: TitleType,
  ) {}

  /** Search titles for the configured type. */
  @Get('search')
  search(@Query() query: SearchTitlesQueryDto) {
    const { q } = query;
    if (!q?.trim()) return [];
    return this.titlesService.search(this.titleType, q);
  }

  /** List the authenticated user's titles for the configured type. */
  @Get()
  getMyTitles(@Req() req: AuthenticatedRequest, @Query() query: TitleListQueryDto) {
    return this.titlesService.getUserTitles(this.titleType, req.user.id, query);
  }

  /** Add one title of the configured type to the authenticated user's library. */
  @Post()
  addTitle(@Req() req: AuthenticatedRequest, @Body() dto: AddTitleDto) {
    return this.titlesService.addTitle(this.titleType, req.user.id, dto);
  }

  /** Return one title of the configured type from the authenticated user's library. */
  @Get(':id')
  getTitle(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.titlesService.getUserTitle(this.titleType, req.user.id, id);
  }
}
