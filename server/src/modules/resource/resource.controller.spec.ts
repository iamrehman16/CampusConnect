import { ResourceController } from './resource.controller';
import { ResourceService } from './resource.service';

describe('ResourceController', () => {
  it('should be defined', () => {
    const resourceService: Partial<ResourceService> = {};
    const controller = new ResourceController(
      resourceService as ResourceService,
    );

    expect(controller).toBeDefined();
  });
});
