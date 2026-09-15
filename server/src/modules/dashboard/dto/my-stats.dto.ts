import { IsNumber } from 'class-validator';

export class MyStatsDto {
  @IsNumber()
  postCount: number;
  @IsNumber()
  totalUpvotesReceived: number;
  @IsNumber()
  resourceCount: number;
  @IsNumber()
  totalDownloads: number;
}
