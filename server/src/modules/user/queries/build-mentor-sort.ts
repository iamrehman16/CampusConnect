import { ISortBuilder } from '../../../common/interfaces/sort-builder.interface';
import { MentorQueryDto, MentorSort } from '../dto/mentor-query.dto';

export class MentorSortBuilder implements ISortBuilder {
  build(dto: MentorQueryDto): Record<string, 1 | -1> {
    // `_id` tiebreaker keeps pagination stable when scores/timestamps tie.
    return dto.sort === MentorSort.ACTIVE
      ? { lastSeenAt: -1, _id: 1 }
      : { contributionScore: -1, _id: 1 };
  }
}
