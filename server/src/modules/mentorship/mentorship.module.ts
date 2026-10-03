import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../../common/common.module';
import { UserModule } from '../user/user.module';
import { ChatModule } from '../chat/chat.module';
import { ModerationModule } from '../moderation/moderation.module';
import { Mentorship, MentorshipSchema } from './schema/mentorship.schema';
import { Endorsement, EndorsementSchema } from './schema/endorsement.schema';
import { MentorEndorsementService } from './mentor-endorsement.service';
import { EndorsementController } from './endorsement.controller';
import { MentorshipService } from './mentorship.service';
import { MentorshipController } from './mentorship.controller';
import { MentorFeedbackService } from './mentor-feedback.service';
import { MentorRecommendationService } from './mentor-recommendation.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Mentorship.name, schema: MentorshipSchema },
      { name: Endorsement.name, schema: EndorsementSchema },
    ]),
    CommonModule,
    UserModule,
    ChatModule,
    ModerationModule,
  ],
  controllers: [MentorshipController, EndorsementController],
  providers: [
    MentorshipService,
    MentorRecommendationService,
    MentorFeedbackService,
    MentorEndorsementService,
  ],
})
export class MentorshipModule {}
