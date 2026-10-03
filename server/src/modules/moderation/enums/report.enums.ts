export enum ReportTargetType {
  MESSAGE = 'message',
  CONVERSATION = 'conversation',
  /** Reporting a person directly, e.g. a mentor from their profile. */
  USER = 'user',
}

export enum ReportReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  INAPPROPRIATE = 'inappropriate',
  OTHER = 'other',
}

export enum ReportStatus {
  OPEN = 'open',
  DISMISSED = 'dismissed',
  WARNED = 'warned',
  SUSPENDED = 'suspended',
}

/** What an admin can do with an open report. */
export enum ReportResolution {
  DISMISS = 'dismiss',
  WARN = 'warn',
  SUSPEND = 'suspend',
}
