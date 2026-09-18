import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  it('should be defined', () => {
    const userService: Partial<UserService> = {};
    const controller = new UserController(userService as UserService);

    expect(controller).toBeDefined();
  });
});
