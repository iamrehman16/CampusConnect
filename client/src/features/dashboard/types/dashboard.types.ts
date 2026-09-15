export interface MyStatsDto {
  postCount: number;
  totalUpvotesReceived: number;
  resourceCount: number;
  totalDownloads: number;
}

export interface PublicStatsDto {
  totalUsers: number;
  availableMentors: number;
  totalResources: number;
  postsThisMonth: number;
}
