import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { ActivityService } from './activity.service';
import { FeedQueryDto } from './dto/feed-query.dto';

@Controller('feed')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /** Return one cursor-paginated page of followed-user activity. */
  @Get()
  getFeed(@Req() req: AuthenticatedRequest, @Query() query: FeedQueryDto) {
    return this.activityService.getFeed(req.user.id, query.cursor, query.limit);
  }
}
