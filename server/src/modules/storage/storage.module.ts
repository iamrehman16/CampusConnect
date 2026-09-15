import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import configureCloudinary from './config/cloudinary.config';
import cloudinaryConfig from './config/cloudinary.config';

@Module({
  providers: [
    {
      provide: cloudinaryConfig.KEY,
      useFactory: configureCloudinary,
    },
    CloudinaryService,
  ],
  exports: [CloudinaryService],
})
export class StorageModule {}
