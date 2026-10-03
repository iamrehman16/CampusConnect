import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../../common/common.module';
import { UserModule } from '../user/user.module';
import { ChatModule } from '../chat/chat.module';
import { ModerationModule } from '../moderation/moderation.module';
import { Mentorship, MentorshipSchema } from './schema/mentorship.schema';
import { MentorshipService } from './mentorship.service';
import { MentorshipController } from './mentorship.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Mentorship.name, schema: MentorshipSchema },
    ]),
    CommonModule,
    UserModule,
    ChatModule,
    ModerationModule,
  ],
  controllers: [MentorshipController],
  providers: [MentorshipService],
})
export class MentorshipModule {}
