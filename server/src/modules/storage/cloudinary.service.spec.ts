import { CloudinaryService } from './cloudinary.service';

describe('CloudinaryService', () => {
  it('should be defined', () => {
    const service = new CloudinaryService({
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
    });

    expect(service).toBeDefined();
  });
});
