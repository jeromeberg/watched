import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TmdbModule } from '../tmdb/tmdb.module';
import { TitlesModule } from '../titles/titles.module';
import { ShowsController } from './shows.controller';
import { ShowsService } from './shows.service';

@Module({
  imports: [AuthModule, TmdbModule, TitlesModule],
  controllers: [ShowsController],
  providers: [ShowsService],
  exports: [ShowsService],
})
export class ShowsModule {}
