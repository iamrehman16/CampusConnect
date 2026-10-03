import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UserModule } from '../user/user.module';
import { ResourceModule } from '../resource/resource.module';
import { PostModule } from '../post/post.module';
import { DashboardController } from './dashboard.controller';
import { ImpactService } from './impact.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ReputationEvent,
  ReputationEventSchema,
} from '../reputation/schema/reputation-event.schema';
import {
  Mentorship,
  MentorshipSchema,
} from '../mentorship/schema/mentorship.schema';

@Module({
  imports: [
    UserModule,
    ResourceModule,
    PostModule,
    // Read-only: the impact panel aggregates the ledger and mentorships.
    MongooseModule.forFeature([
      { name: ReputationEvent.name, schema: ReputationEventSchema },
      { name: Mentorship.name, schema: MentorshipSchema },
    ]),
  ],
  controllers: [AdminDashboardController, DashboardController],
  providers: [DashboardService, ImpactService],
})
export class DashboardModule {}
