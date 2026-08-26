import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { TitleType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { TitlesService, parseTitleListQuery, AddTitleDto } from '../titles/titles.service';

@Controller('shows')
@UseGuards(JwtAuthGuard)
export class ShowsController {
  constructor(private readonly titlesService: TitlesService) {}

  @Get('search')
  search(@Query('q') q: string) {
    if (!q?.trim()) return [];
    return this.titlesService.search(TitleType.TV, q.trim());
  }

  @Get()
  getMyShows(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('order') order?: string,
    @Query('limit') limit?: string,
  ) {
    return this.titlesService.getUserTitles(
      TitleType.TV,
      req.user.id,
      parseTitleListQuery({ status, order, limit }),
    );
  }

  @Post()
  addShow(@Req() req: AuthenticatedRequest, @Body() dto: AddTitleDto) {
    return this.titlesService.addTitle(TitleType.TV, req.user.id, dto);
  }

  @Get(':id')
  getShow(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.titlesService.getUserTitle(TitleType.TV, req.user.id, id);
  }
}
