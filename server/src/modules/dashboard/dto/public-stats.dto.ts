import { IsNumber } from 'class-validator';

export class PublicStatsDto {
  @IsNumber()
  totalUsers: number;

  @IsNumber()
  availableMentors: number;

  @IsNumber()
  totalResources: number;

  @IsNumber()
  postsThisMonth: number;
}
