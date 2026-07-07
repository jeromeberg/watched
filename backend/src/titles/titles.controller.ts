import { Controller, Patch, Param, Body, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { WatchStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { TitlesService } from './titles.service';

class UpdateUserTitleDto {
  rating?: number | null;
  status?: WatchStatus;
  notes?: string | null;
}

@Controller('titles')
@UseGuards(JwtAuthGuard)
export class TitlesController {
  constructor(private readonly titlesService: TitlesService) {}

  @Patch(':id')
  updateUserTitle(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateUserTitleDto,
  ) {
    return this.titlesService.updateUserTitle(req.user.id, id, dto);
  }
}
