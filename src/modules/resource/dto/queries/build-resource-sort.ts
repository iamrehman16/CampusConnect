import { ResourceQueryDto } from '../resource-query.dto';
import { ResourceSort } from '../../enums/resource-sort.enum';
import { ISortBuilder } from '../../../../common/interfaces/sort-builder.interface';

export class ResourceSortBuilder implements ISortBuilder {
  build(dto: ResourceQueryDto): Record<string, 1 | -1> {
    switch (dto.sort) {
      case ResourceSort.OLDEST:
        return { createdAt: 1 };
      case ResourceSort.POPULAR:
      case ResourceSort.DOWNLOADS:
        return { downloads: -1 };
      case ResourceSort.NEWEST:
      default:
        return { createdAt: -1 };
    }
  }
}
