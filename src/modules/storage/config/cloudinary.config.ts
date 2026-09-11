//storage/config/cloudinary.config.ts

import { registerAs } from '@nestjs/config';

export const CLOUDINARY_CONFIG_KEY = 'CLOUDINARY';

export default registerAs(CLOUDINARY_CONFIG_KEY, () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  apiKey: process.env.CLOUDINARY_API_KEY!,
  apiSecret: process.env.CLOUDINARY_API_SECRET!,
}));
