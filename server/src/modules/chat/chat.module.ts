import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { Conversation, ConversationSchema } from './schema/conversation.schema';
import { Message, MessageSchema } from './schema/message.schema';
import { WsJwtGuard } from './guards/websocket.jwt.guard';
import { CommonModule } from '../../common/common.module';
import { PresenceService } from './presence.service';
import { UserModule } from '../user/user.module';
import jwtConfig from '../auth/config/jwt.config';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),

    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),

    CommonModule,
    UserModule,
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, PresenceService, WsJwtGuard],
  exports: [ChatService],
})
export class ChatModule {}
