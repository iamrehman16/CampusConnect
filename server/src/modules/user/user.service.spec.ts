import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { PaginationService } from '../../common/services/pagination.service';
import { Model } from 'mongoose';

describe('UserService', () => {
  it('should be defined', () => {
    const userModel: Partial<Model<User>> = {};
    const paginationService: Partial<PaginationService> = {};

    const service = new UserService(
      userModel as Model<User>,
      paginationService as PaginationService,
    );

    expect(service).toBeDefined();
  });
});
