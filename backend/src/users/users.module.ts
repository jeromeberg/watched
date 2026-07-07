import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { TitlesModule } from '../titles/titles.module';
import { ShowsModule } from '../shows/shows.module';
import { CollectionsModule } from '../collections/collections.module';

@Module({
  imports: [AuthModule, TitlesModule, ShowsModule, CollectionsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
