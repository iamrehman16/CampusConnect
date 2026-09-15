import { ISortBuilder } from '../../../common/interfaces/sort-builder.interface';
import { UserQueryBuilder } from './build-user-query';
import { UserQueryDto } from '../dto/user-query.dto';

export class UserSortBuilder implements ISortBuilder {
  build(dto: UserQueryDto): Record<string, 1 | -1> {
    return { createdAt: -1 };
  }
}
