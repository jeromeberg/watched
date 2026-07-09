import { Controller, Get, Patch, Param, Query, Body, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { TitleType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TitlesService, parseTitleListQuery } from '../titles/titles.service';
import { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { UsersService } from './users.service';

class UpdateProfileDto {
  bio?: string | null;
  topPicks?: number[];
}

class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly titlesService: TitlesService,
  ) {}

  @Get('users/:username/public')
  getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }

  @Get('users/:username/movies')
  getPublicMovies(
    @Param('username') username: string,
    @Query('status') status?: string,
    @Query('order') order?: string,
    @Query('limit') limit?: string,
  ) {
    return this.titlesService.getPublicUserTitles(
      TitleType.MOVIE,
      username,
      parseTitleListQuery({ status, order, limit }),
    );
  }

  @Get('users/:username/shows')
  getPublicShows(
    @Param('username') username: string,
    @Query('status') status?: string,
    @Query('order') order?: string,
    @Query('limit') limit?: string,
  ) {
    return this.titlesService.getPublicUserTitles(
      TitleType.TV,
      username,
      parseTitleListQuery({ status, order, limit }),
    );
  }

  @Get('users/:username/movies/:id')
  getPublicMovie(@Param('username') username: string, @Param('id', ParseIntPipe) id: number) {
    return this.titlesService.getPublicUserTitle(TitleType.MOVIE, username, id);
  }

  @Get('users/:username/shows/:id')
  getPublicShow(@Param('username') username: string, @Param('id', ParseIntPipe) id: number) {
    return this.titlesService.getPublicUserTitle(TitleType.TV, username, id);
  }

  @Get('users/:username/shows/:id/episodes')
  getPublicEpisodes(@Param('username') username: string, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.getPublicEpisodes(username, id);
  }

  @Get('users/:username/collections/:collectionId')
  getPublicCollection(
    @Param('username') username: string,
    @Param('collectionId', ParseIntPipe) collectionId: number,
  ) {
    return this.usersService.getPublicCollection(username, collectionId);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto.bio, dto.topPicks);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() req: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }
}
