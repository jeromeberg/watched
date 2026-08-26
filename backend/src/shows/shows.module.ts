import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TitlesModule } from '../titles/titles.module';
import { ShowsController } from './shows.controller';

@Module({
  imports: [AuthModule, TitlesModule],
  controllers: [ShowsController],
})
export class ShowsModule {}
