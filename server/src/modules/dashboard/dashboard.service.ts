import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ResourceService } from '../resource/resource.service';
import { PostService } from '../post/post.service';
import {
  ResourceAnalyticsDto,
  UserGrowthDto,
} from './dto/resource-analytics.dto';
import { PublicStatsDto } from './dto/public-stats.dto';
import { MyStatsDto } from './dto/my-stats.dto';
import { Model, Types } from 'mongoose';
import { ApprovalStatus } from '../resource/enums/approval-status.enum';
import { Post, PostDocument } from '../post/schemas/post.schema';
import { InjectModel } from '@nestjs/mongoose';
import {
  Resource,
  ResourceDocument,
} from '../resource/schemas/resource.schema';

@Injectable()
export class DashboardService {
  constructor(
    private readonly userService: UserService,
    private readonly resourceService: ResourceService,
    private readonly postService: PostService,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Resource.name) private resourceModel: Model<ResourceDocument>,
  ) {}

  async getOverviewStats() {
    const [userStats, resourceStats, postStats] = await Promise.all([
      this.userService.getStats(),
      this.resourceService.getStats(),
      this.postService.getPostStats(),
    ]);

    return {
      users: userStats,
      resources: resourceStats,
      posts: postStats,
      timestamp: new Date(),
    };
  }

  async getResourceAnalytics(): Promise<ResourceAnalyticsDto> {
    return this.resourceService.getAnalytics();
  }

  async getUserGrowth(): Promise<UserGrowthDto> {
    return this.userService.getGrowth();
  }

  async getPublicStats(): Promise<PublicStatsDto> {
    const [userInfo, totalResources, postsThisMonth] = await Promise.all([
      this.userService.getTotalUsersAndMentors(),
      this.resourceService.getTotalResourceCount(),
      this.postService.countPostsDaysAgo(30),
    ]);

    return {
      totalUsers: userInfo.totalUsers,
      availableMentors: userInfo.totalContributors,
      totalResources,
      postsThisMonth,
    };
  }

  async getMyStats(userId: string): Promise<MyStatsDto> {
    const objectId = new Types.ObjectId(userId);

    const [postStats, resourceStats] = await Promise.all([
      this.postModel.aggregate([
        { $match: { author: objectId, isDeleted: false } },
        {
          $group: {
            _id: null,
            postCount: { $sum: 1 },
            totalUpvotesReceived: { $sum: { $size: '$upvotes' } },
          },
        },
      ]),
      this.resourceModel.aggregate([
        {
          $match: {
            uploadedBy: objectId,
            isDeleted: false,
            approvalStatus: ApprovalStatus.APPROVED,
          },
        },
        {
          $group: {
            _id: null,
            resourceCount: { $sum: 1 },
            totalDownloads: { $sum: '$downloads' },
          },
        },
      ]),
    ]);

    return {
      postCount: postStats[0]?.postCount ?? 0,
      totalUpvotesReceived: postStats[0]?.totalUpvotesReceived ?? 0,
      resourceCount: resourceStats[0]?.resourceCount ?? 0,
      totalDownloads: resourceStats[0]?.totalDownloads ?? 0,
    };
  }
}
