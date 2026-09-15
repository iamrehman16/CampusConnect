import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ResourceModule } from './modules/resource/resource.module';
import { StorageModule } from './modules/storage/storage.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PostModule } from './modules/post/post.module';
import { AiModule } from './modules/ai/ai.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CommonModule } from './common/common.module';
import { ChatModule } from './modules/chat/chat.module';
import { BullModule } from '@nestjs/bullmq';
import { QueuesModule } from './modules/queues/queues.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        return {
          connection: {
            url: isProduction
              ? configService.get<string>('REDIS_UPSTASH_URL')
              : configService.get<string>('REDIS_LOCAL_URL'),
          },
        };
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';
        return {
          uri: isProduction
            ? configService.get<string>('MONGO_URI')
            : configService.get<string>('MONGO_URI_Local'),
        };
      },
    }),
    EventEmitterModule.forRoot(),
    UserModule,
    AuthModule,
    ResourceModule,
    StorageModule,
    DashboardModule,
    PostModule,
    AiModule,
    CommonModule,
    ChatModule,
    QueuesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
