// dashboard/dto/resource-analytics.dto.ts
export class DailyCountDto {
  date: string; // 'YYYY-MM-DD'
  count: number;
}

export class ApprovalFunnelDto {
  pending: number;
  approved: number;
  rejected: number;
}

export class DistributionItemDto {
  label: string;
  count: number;
}

export class TopContributorDto {
  userId: string;
  name: string;
  avatar?: string;
  uploads: number;
}

export class ResourceAnalyticsDto {
  dailyUploads: DailyCountDto[];
  approvalFunnel: ApprovalFunnelDto;
  byFileType: DistributionItemDto[];
  bySubject: DistributionItemDto[];
  bySemester: DistributionItemDto[];
  avgApprovalHours: number;
  topContributors: TopContributorDto[];
}

export class UserGrowthDto {
  dailyRegistrations: DailyCountDto[];
}
