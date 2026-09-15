import { IQueryBuilder } from '../../../common/interfaces/query-builder.interface';
import { UserQueryDto } from '../dto/user-query.dto';
import { QueryFilter } from 'mongoose';
import { UserDocument } from '../schemas/user.schema';

export class UserQueryBuilder implements IQueryBuilder<UserQueryDto> {
  build(dto: UserQueryDto): QueryFilter<UserDocument> {
    const query: QueryFilter<UserDocument> = {};

    if (dto.semester) {
      query.semester = dto.semester;
    }
    if (dto.role) {
      query.role = dto.role;
    }
    if (dto.status) {
      query.accountStatus = dto.status;
    }
    if (dto.search) {
      query.$text = { $search: dto.search };
    }
    return query;
  }
}
