import { ISortBuilder } from '../../../common/interfaces/sort-builder.interface';
import { UserQueryDto } from '../dto/user-query.dto';

export class UserSortBuilder implements ISortBuilder {
  build(_dto: UserQueryDto): Record<string, 1 | -1> {
    return { createdAt: -1 };
  }
}
