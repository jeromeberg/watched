import { Controller, Get, Patch, Param, Query, Body, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { parseTitleListQuery } from '../titles/titles.service';
import { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { UsersService } from './users.service';
import { titleTypeForRoute } from '../titles/title-route.config';

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
  constructor(private readonly usersService: UsersService) {}

  @Get('users/:username/public')
  getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }

  @Get('users/:username/collections/:collectionId')
  getPublicCollection(
    @Param('username') username: string,
    @Param('collectionId', ParseIntPipe) collectionId: number,
  ) {
    return this.usersService.getPublicCollection(username, collectionId);
  }

  @Get('users/:username/:library')
  getPublicTitles(
    @Param('username') username: string,
    @Param('library') library: string,
    @Query('status') status?: string,
    @Query('order') order?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getPublicTitles(
      username,
      titleTypeForRoute(library),
      parseTitleListQuery({ status, order, limit }),
    );
  }

  @Get('users/:username/:library/:id')
  getPublicTitle(
    @Param('username') username: string,
    @Param('library') library: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.getPublicTitle(username, titleTypeForRoute(library), id);
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
