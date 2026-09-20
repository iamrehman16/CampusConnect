import { Injectable } from '@nestjs/common';
import { Model, PopulateOptions } from 'mongoose';
import { BaseQueryDto } from '../dto/base-query.dto';
import { IQueryBuilder } from '../interfaces/query-builder.interface';
import { ISortBuilder } from '../interfaces/sort-builder.interface';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
}

@Injectable()
export class PaginationService {
  async paginate<T>(
    model: Model<T>,
    dto: BaseQueryDto,
    queryBuilder: IQueryBuilder<any>,
    sortBuilder: ISortBuilder,
    /** Optional field projection (e.g. 'name avatar') for public-safe listings. */
    select?: string,
  ): Promise<PaginatedResult<T>> {
    const filter = queryBuilder.build(dto);
    const sort = sortBuilder.build(dto);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      (select ? model.find(filter).select(select) : model.find(filter))
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      model.countDocuments(filter).lean().exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    };
  }

  async paginateWithPopulate<T>(
    model: Model<T>,
    dto: BaseQueryDto,
    queryBuilder: IQueryBuilder<any>,
    sortBuilder: ISortBuilder,
    populate: PopulateOptions | PopulateOptions[],
  ): Promise<PaginatedResult<T>> {
    const filter = queryBuilder.build(dto);
    const sort = sortBuilder.build(dto);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      model
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate(populate)
        .lean()
        .exec(),
      model.countDocuments(filter).lean().exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    };
  }
}
