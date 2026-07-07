import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TmdbModule } from '../tmdb/tmdb.module';
import { TitlesController } from './titles.controller';
import { TitlesService } from './titles.service';

@Module({
  imports: [AuthModule, TmdbModule],
  controllers: [TitlesController],
  providers: [TitlesService],
  exports: [TitlesService],
})
export class TitlesModule {}
