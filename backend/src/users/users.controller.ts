import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { UsersService } from './users.service';
import { titleTypeForRoute } from '../titles/title-route.config';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/profile.dto';
import { UpdateSettingsDto } from './dto/settings.dto';
import { TitleListQueryDto } from '../titles/dto/title-list-query.dto';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users/:username/public')
  getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }

  /** List the users who follow a public profile. */
  @Get('users/:username/followers')
  getFollowers(@Param('username') username: string) {
    return this.usersService.getFollowers(username);
  }

  /** List the users followed by a public profile. */
  @Get('users/:username/following')
  getFollowing(@Param('username') username: string) {
    return this.usersService.getFollowing(username);
  }

  /** Return whether the signed-in user follows a public profile. */
  @Get('users/:username/follow-status')
  @UseGuards(JwtAuthGuard)
  getFollowStatus(@Req() req: AuthenticatedRequest, @Param('username') username: string) {
    return this.usersService.getFollowStatus(req.user.id, username);
  }

  /** Follow a public profile for the signed-in user. */
  @Post('users/:username/follow')
  @UseGuards(JwtAuthGuard)
  follow(@Req() req: AuthenticatedRequest, @Param('username') username: string) {
    return this.usersService.follow(req.user.id, username);
  }

  /** Stop following a public profile for the signed-in user. */
  @Delete('users/:username/follow')
  @UseGuards(JwtAuthGuard)
  unfollow(@Req() req: AuthenticatedRequest, @Param('username') username: string) {
    return this.usersService.unfollow(req.user.id, username);
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
    @Query() query: TitleListQueryDto,
  ) {
    return this.usersService.getPublicTitles(username, titleTypeForRoute(library), query);
  }

  @Get('users/:username/:library/:id')
  getPublicTitle(
    @Param('username') username: string,
    @Param('library') library: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.getPublicTitle(username, titleTypeForRoute(library), id);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  /** Return the signed-in user's complete profile. */
  getOwnProfile(@Req() req: AuthenticatedRequest) {
    return this.usersService.getOwnProfile(req.user.id);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto.bio, dto.topPicks);
  }

  @Get('me/settings')
  @UseGuards(JwtAuthGuard)
  /** Return the signed-in user's content settings. */
  getSettings(@Req() req: AuthenticatedRequest) {
    return this.usersService.getSettings(req.user.id);
  }

  @Patch('me/settings')
  @UseGuards(JwtAuthGuard)
  /** Update the signed-in user's content settings. */
  updateSettings(@Req() req: AuthenticatedRequest, @Body() dto: UpdateSettingsDto) {
    return this.usersService.updateSettings(req.user.id, dto);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() req: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }
}
