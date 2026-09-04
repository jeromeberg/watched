import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TmdbModule } from '../tmdb/tmdb.module';
import { TitlesController } from './titles.controller';
import { TitlesService } from './titles.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [AuthModule, TmdbModule, ActivityModule],
  controllers: [TitlesController],
  providers: [TitlesService],
  exports: [TitlesService],
})
export class TitlesModule {}
