import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TitleLibraryController } from '../titles/title-library.controller';
import { TITLE_ROUTES } from '../titles/title-route.config';
import { TitlesService } from '../titles/titles.service';

@Controller('movies')
@UseGuards(JwtAuthGuard)
export class MoviesController extends TitleLibraryController {
  constructor(titlesService: TitlesService) {
    super(titlesService, TITLE_ROUTES.movies.type);
  }
}
