import { Controller, Patch, Delete, Param, Body, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { UpdateUserTitleDto } from './dto/update-user-title.dto';
import { TitlesService } from './titles.service';

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

  @Delete(':id')
  removeUserTitle(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.titlesService.removeUserTitle(req.user.id, id);
  }
}
