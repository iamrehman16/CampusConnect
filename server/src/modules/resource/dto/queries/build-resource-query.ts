import { QueryFilter } from 'mongoose';
import { ResourceDocument } from '../../schemas/resource.schema';
import { ResourceQueryDto } from '../resource-query.dto';
import { ApprovalStatus } from '../../enums/approval-status.enum';
import { IQueryBuilder } from '../../../../common/interfaces/query-builder.interface';
import { escapeRegex } from '../../../../common/utils/escape-regex';

export class ResourceQueryBuilder implements IQueryBuilder<ResourceQueryDto> {
  build(dto: ResourceQueryDto): QueryFilter<ResourceDocument> {
    const query: QueryFilter<ResourceDocument> = {
      isDeleted: false,
      approvalStatus: dto.status || ApprovalStatus.APPROVED,
    };

    if (dto.uploadedBy) {
      query.uploadedBy = dto.uploadedBy;
    }
    if (dto.type) {
      query.resourceType = dto.type;
    }
    if (dto.semester !== undefined) {
      query.semester = dto.semester;
    }
    if (dto.course) {
      // Stored course codes aren't normalised ("CS-341" vs "cs343"), so
      // match case-insensitively; anchored + escaped, so still exact.
      query.course = {
        $regex: `^${escapeRegex(dto.course.trim())}$`,
        $options: 'i',
      };
    }
    if (dto.search) {
      query.$text = { $search: dto.search };
    }

    return query;
  }
}
