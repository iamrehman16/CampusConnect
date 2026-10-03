/** A user the signed-in member has blocked (BACKLOG.md E16). */
export interface BlockedUser {
  id: string;
  name: string;
  avatar?: string;
  blockedAt: string;
}

export type ReportTargetType = "message" | "conversation" | "user";
export type ReportReason = "spam" | "harassment" | "inappropriate" | "other";
export type ReportStatus = "open" | "dismissed" | "warned" | "suspended";
export type ReportResolution = "dismiss" | "warn" | "suspend";

export const REPORT_REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: "spam", label: "Spam", hint: "Unwanted promotion or repeated junk" },
  { value: "harassment", label: "Harassment", hint: "Bullying, threats or targeting someone" },
  { value: "inappropriate", label: "Inappropriate", hint: "Offensive or unsuitable content" },
  { value: "other", label: "Something else", hint: "Tell us what happened" },
];

export interface CreateReportDto {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}

export interface ReportParty {
  id: string;
  name: string;
  avatar?: string;
}

/** A message copied into the report when it was filed (BACKLOG.md E16). */
export interface ReportEvidenceLine {
  messageId: string;
  senderId: string;
  content: string;
  sentAt: string;
  wasDeleted: boolean;
}

export interface AdminReport {
  id: string;
  status: ReportStatus;
  targetType: ReportTargetType;
  reason: ReportReason;
  details?: string;
  reporter: ReportParty | null;
  reportedUser: ReportParty | null;
  conversationId?: string;
  messageId?: string;
  evidence: ReportEvidenceLine[];
  resolutionNote?: string;
  resolvedAt?: string;
  createdAt: string;
}
