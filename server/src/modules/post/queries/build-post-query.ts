import { IQueryBuilder } from '../../../common/interfaces/query-builder.interface';
import { QueryFilter, Types } from 'mongoose';
import { PostDocument } from '../schemas/post.schema';
import { PostQueryDto } from '../dto/post-query.dto';

export class PostQueryBuilder implements IQueryBuilder<PostQueryDto> {
  build(dto: PostQueryDto): QueryFilter<PostDocument> {
    const query: QueryFilter<PostDocument> = {};

    if (dto.id) {
      query.author = new Types.ObjectId(dto.id);
    }
    return query;
  }
}
