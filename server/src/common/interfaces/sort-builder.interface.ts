import { BaseQueryDto } from '../dto/base-query.dto';

export interface ISortBuilder {
  build(dto: BaseQueryDto): Record<string, 1 | -1>;
}
