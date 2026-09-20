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

describe('UserService score/tier writes', () => {
  function build() {
    const exec = jest.fn().mockResolvedValue({});
    const updateOne = jest.fn().mockReturnValue({ exec });
    const service = new UserService(
      { updateOne } as unknown as Model<User>,
      {} as PaginationService,
    );
    return { service, updateOne };
  }

  it('adjustContributionScore writes score and tier in one pipeline update (requires updatePipeline)', async () => {
    const { service, updateOne } = build();

    await service.adjustContributionScore('u1', 10);

    const [filter, update, options] = updateOne.mock.calls[0] as [
      unknown,
      unknown[],
      { updatePipeline?: boolean },
    ];
    expect(filter).toEqual({ _id: 'u1' });
    expect(Array.isArray(update)).toBe(true);
    // Mongoose throws "Cannot pass an array to query updates unless the
    // `updatePipeline` option is set" without this — mocks can't catch it.
    expect(options).toEqual({ updatePipeline: true });
    expect(JSON.stringify(update)).toContain('$switch');
  });

  it('setContributionScore stores the tier derived from the score', async () => {
    const { service, updateOne } = build();

    await service.setContributionScore('u1', 60);

    expect(updateOne).toHaveBeenCalledWith(
      { _id: 'u1' },
      { contributionScore: 60, tier: 'trusted' },
    );
  });
});
