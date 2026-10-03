import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../../common/common.module';
import { UserModule } from '../user/user.module';
import {
  Conversation,
  ConversationSchema,
} from '../chat/schema/conversation.schema';
import { Message, MessageSchema } from '../chat/schema/message.schema';
import { UserBlock, UserBlockSchema } from './schema/user-block.schema';
import { Report, ReportSchema } from './schema/report.schema';
import { BlockService } from './block.service';
import { BlockController } from './block.controller';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ReportAdminController } from './report-admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserBlock.name, schema: UserBlockSchema },
      { name: Report.name, schema: ReportSchema },
      // Read-only here: reports snapshot messages as evidence. Registered by
      // schema (like chat does for Resource/Post) rather than importing
      // ChatModule, which depends on this module.
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    CommonModule,
    UserModule,
  ],
  controllers: [BlockController, ReportController, ReportAdminController],
  providers: [BlockService, ReportService],
  exports: [BlockService],
})
export class ModerationModule {}
