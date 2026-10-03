import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { UserBlock, UserBlockSchema } from './schema/user-block.schema';
import { BlockService } from './block.service';
import { BlockController } from './block.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserBlock.name, schema: UserBlockSchema },
    ]),
    UserModule,
  ],
  controllers: [BlockController],
  providers: [BlockService],
  exports: [BlockService],
})
export class ModerationModule {}
