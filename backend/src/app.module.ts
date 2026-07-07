import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MoviesModule } from './movies/movies.module';
import { ShowsModule } from './shows/shows.module';
import { EpisodesModule } from './episodes/episodes.module';
import { TitlesModule } from './titles/titles.module';
import { CollectionsModule } from './collections/collections.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MoviesModule,
    ShowsModule,
    EpisodesModule,
    TitlesModule,
    CollectionsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
