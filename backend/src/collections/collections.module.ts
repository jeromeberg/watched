import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [AuthModule, ActivityModule],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
