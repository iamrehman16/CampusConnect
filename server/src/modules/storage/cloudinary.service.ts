import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { v2 as cloudinarySDK } from 'cloudinary';

import { ConfigType } from '@nestjs/config';
import cloudinaryConfig from './config/cloudinary.config';

@Injectable()
export class CloudinaryService {
  private readonly cloudinary = cloudinarySDK;

  constructor(
    @Inject(cloudinaryConfig.KEY)
    private resourceCfg: ConfigType<typeof cloudinaryConfig>,
  ) {}

  generateSignature(paramsToSign: Record<string, string | number>): string {
    return this.cloudinary.utils.api_sign_request(
      paramsToSign,
      this.resourceCfg.apiSecret,
    );
  }
  generateDownloadUrl(secureUrl: string): string {
    if (!secureUrl?.includes('/upload/')) {
      throw new InternalServerErrorException('Invalid Cloudinary URL format');
    }
    return secureUrl.replace('/upload/', '/upload/fl_attachment/');
  }
  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'raw' = 'raw',
  ): Promise<void> {
    try {
      await this.cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } catch {
      throw new InternalServerErrorException(
        'Failed to delete file from Cloudinary',
      );
    }
  }
}
