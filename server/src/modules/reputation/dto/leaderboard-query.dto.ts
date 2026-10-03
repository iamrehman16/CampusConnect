import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum LeaderboardPeriod {
  /** Points earned since the start of the current UTC month. */
  MONTH = 'month',
  /** Lifetime reputation. */
  ALL = 'all',
}

export class LeaderboardQueryDto {
  @IsOptional()
  @IsEnum(LeaderboardPeriod)
  period?: LeaderboardPeriod = LeaderboardPeriod.MONTH;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export interface LeaderboardEntryDto {
  rank: number;
  id: string;
  name: string;
  avatar?: string;
  tier: string;
  /** Points for the chosen period (this month's earnings, or lifetime score). */
  points: number;
}
