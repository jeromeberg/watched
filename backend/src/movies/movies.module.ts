import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TitlesModule } from '../titles/titles.module';
import { MoviesController } from './movies.controller';

@Module({
  imports: [AuthModule, TitlesModule],
  controllers: [MoviesController],
})
export class MoviesModule {}
