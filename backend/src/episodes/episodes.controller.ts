import { Controller, Post, Delete, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { EpisodesService } from './episodes.service';

@Controller('episodes')
@UseGuards(JwtAuthGuard)
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Post(':id/watched')
  markWatched(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.episodesService.markWatched(req.user.id, id);
  }

  @Delete(':id/watched')
  unmarkWatched(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.episodesService.unmarkWatched(req.user.id, id);
  }
}
