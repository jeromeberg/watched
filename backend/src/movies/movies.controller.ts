import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { TitleType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { TitlesService, parseTitleListQuery, AddTitleDto } from '../titles/titles.service';

@Controller('movies')
@UseGuards(JwtAuthGuard)
export class MoviesController {
  constructor(private readonly titlesService: TitlesService) {}

  @Get('search')
  search(@Query('q') q: string) {
    if (!q?.trim()) return [];
    return this.titlesService.search(TitleType.MOVIE, q.trim());
  }

  @Get()
  getMyMovies(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('order') order?: string,
    @Query('limit') limit?: string,
  ) {
    return this.titlesService.getUserTitles(
      TitleType.MOVIE,
      req.user.id,
      parseTitleListQuery({ status, order, limit }),
    );
  }

  @Post()
  addMovie(@Req() req: AuthenticatedRequest, @Body() dto: AddTitleDto) {
    return this.titlesService.addTitle(TitleType.MOVIE, req.user.id, dto);
  }

  @Get(':id')
  getMovie(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.titlesService.getUserTitle(TitleType.MOVIE, req.user.id, id);
  }
}
