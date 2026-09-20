import 'reflect-metadata';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ROLE_KEY } from '../auth/decorators/role.decorator';
import { Roles } from './enums/user-role.enum';

describe('UserController', () => {
  it('should be defined', () => {
    const userService: Partial<UserService> = {};
    const controller = new UserController(userService as UserService);

    expect(controller).toBeDefined();
  });
});

describe('UserController access control', () => {
  // Read handlers off the prototype as plain objects (metadata lives on them).
  const handlers = UserController.prototype as unknown as Record<
    string,
    object
  >;
  const rolesOf = (handler: object): unknown =>
    Reflect.getMetadata(ROLE_KEY, handler);

  it('GET /users returns full user documents (incl. email), so it is admin-only', () => {
    expect(rolesOf(handlers.findAll)).toEqual([Roles.ADMIN]);
  });

  it('the member-facing mentor directory is not admin-gated', () => {
    expect(rolesOf(handlers.findMentors)).toBeUndefined();
  });
});
