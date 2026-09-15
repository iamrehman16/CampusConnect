// features/admin/types/admin.types.ts

export interface DailyCount {
  date: string;
  count: number;
}

export interface ApprovalFunnel {
  pending: number;
  approved: number;
  rejected: number;
}

export interface DistributionItem {
  label: string;
  count: number;
}

export interface TopContributor {
  userId: string;
  name: string;
  uploads: number;
}

export interface OverviewStats {
  users: {
    total: number;
    contributors: number;
  };
  resources: {
    total: number;
    pending: number;
    uploadedPastWeek: number;
  };
  posts: {
    total: number;
    recent: number;
  };
  timestamp: string;
}

export interface ResourceAnalytics {
  dailyUploads: DailyCount[];
  approvalFunnel: ApprovalFunnel;
  byFileType: DistributionItem[];
  bySubject: DistributionItem[];
  bySemester: DistributionItem[];
  avgApprovalHours: number;
  topContributors: TopContributor[];
}

export interface UserGrowth {
  dailyRegistrations: DailyCount[];
}