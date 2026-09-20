import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../../common/common.module';
import { UserModule } from '../user/user.module';
import {
  ContributorApplication,
  ContributorApplicationSchema,
} from './schema/contributor-application.schema';
import { ContributorApplicationService } from './contributor-application.service';
import { ContributorApplicationController } from './contributor-application.controller';
import { ContributorApplicationAdminController } from './contributor-application-admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ContributorApplication.name,
        schema: ContributorApplicationSchema,
      },
    ]),
    CommonModule,
    UserModule,
  ],
  controllers: [
    ContributorApplicationController,
    ContributorApplicationAdminController,
  ],
  providers: [ContributorApplicationService],
})
export class ContributorApplicationModule {}
