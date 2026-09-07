import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { TitlesModule } from '../titles/titles.module';
import { CollectionsModule } from '../collections/collections.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [AuthModule, TitlesModule, CollectionsModule, ActivityModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
