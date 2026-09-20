import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { MentorshipStatus } from '../mentorship.state';

export enum MentorshipView {
  /** Requests/mentees where I am the mentor. */
  AS_MENTOR = 'mentor',
  /** Mentors I asked / have, where I am the mentee. */
  AS_MENTEE = 'mentee',
}

export class MentorshipQueryDto extends BaseQueryDto {
  @IsEnum(MentorshipView)
  as: MentorshipView;

  /** Comma-separated, e.g. `status=pending,active`. Omitted = all. */
  @IsOptional()
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
    const raw = obj[key];
    if (typeof raw !== 'string') return undefined;
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  })
  @IsArray()
  @IsEnum(MentorshipStatus, { each: true })
  status?: MentorshipStatus[];
}
