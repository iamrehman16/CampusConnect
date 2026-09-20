export type ApplicationStatus = "Pending" | "Approved" | "Rejected";

export interface ContributorApplication {
  _id: string;
  reason: string;
  sampleUrl?: string;
  status: ApplicationStatus;
  scoreAtApplication: number;
  rejectionReason?: string;
  reviewedAt: string | null;
  createdAt: string;
}

export interface MyApplication {
  /** Most recent application, or null if the user never applied. */
  application: ContributorApplication | null;
  score: number;
  threshold: number;
  eligible: boolean;
  canApply: boolean;
}

export interface CreateApplicationDto {
  reason: string;
  sampleUrl?: string;
}

export interface ApplicantSummary {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  contributionScore: number;
  semester?: number;
  department?: string;
}

export interface AdminApplication extends ContributorApplication {
  applicant: ApplicantSummary;
  /** Applicant's current score meets the eligibility threshold. */
  eligible: boolean;
}

export const APPLICATION_REASON_MIN = 30;
export const APPLICATION_REASON_MAX = 1000;
