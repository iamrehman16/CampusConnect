import { QueryFilter, Types } from 'mongoose';
import { IQueryBuilder } from '../../../common/interfaces/query-builder.interface';
import { escapeRegex } from '../../../common/utils/escape-regex';
import { MentorQueryDto } from '../dto/mentor-query.dto';
import { UserDocument } from '../schemas/user.schema';
import { UserStatus } from '../enums/user-status.enum';
import { DEFAULT_MAX_ACTIVE_MENTEES } from '../user.constants';

const contains = (input: string) => new RegExp(escapeRegex(input.trim()), 'i');
const equalsIgnoreCase = (input: string) =>
  new RegExp(`^${escapeRegex(input.trim())}$`, 'i');

/**
 * Mentor directory filter: active accounts that are open to mentoring,
 * excluding the requester. Free text is always escaped and matched only
 * against public mentoring fields — never email.
 */
export class MentorQueryBuilder implements IQueryBuilder<MentorQueryDto> {
  constructor(private readonly requesterId: string) {}

  build(dto: MentorQueryDto): QueryFilter<UserDocument> {
    const and: QueryFilter<UserDocument>[] = [
      {
        isOpenToMentor: true,
        accountStatus: UserStatus.ACTIVE,
        _id: { $ne: new Types.ObjectId(this.requesterId) },
      },
    ];

    if (dto.hasCapacity) {
      and.push({
        $expr: {
          $lt: [
            { $ifNull: ['$activeMenteeCount', 0] },
            { $ifNull: ['$maxActiveMentees', DEFAULT_MAX_ACTIVE_MENTEES] },
          ],
        },
      });
    }

    if (dto.department?.trim()) {
      and.push({ department: equalsIgnoreCase(dto.department) });
    }

    if (dto.semesterMin || dto.semesterMax) {
      and.push({
        semester: {
          ...(dto.semesterMin && { $gte: dto.semesterMin }),
          ...(dto.semesterMax && { $lte: dto.semesterMax }),
        },
      });
    }

    if (dto.topic?.trim()) {
      const rx = contains(dto.topic);
      and.push({ $or: [{ mentorTopics: rx }, { expertise: rx }] });
    }

    if (dto.search?.trim()) {
      const rx = contains(dto.search);
      and.push({
        $or: [{ name: rx }, { mentorTopics: rx }, { expertise: rx }],
      });
    }

    return { $and: and };
  }
}
