/**
 * Shared enums mirroring the server's domain enums.
 * Using `as const` objects + type unions instead of `enum` keyword
 * to comply with `erasableSyntaxOnly: true` in tsconfig.
 *
 * TypeScript `enum` emits runtime JavaScript (IIFE), which is NOT erasable.
 * `as const` objects are plain JS — TypeScript types derived from them are erased cleanly.
 */

export const UserRole = {
  STUDENT: 'Student',
  CONTRIBUTOR: 'Contributor',
  ADMIN: 'Admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const ResourceType = {
  NOTES: 'Notes',
  SLIDES: 'Slides',
  ASSIGNMENT: 'Assignment',
  LAB: 'Lab',
  PAST_PAPER: 'PastPaper',
  BOOK: 'Book',
  RESEARCH_PAPER: 'ResearchPaper',
  OTHER: 'Other',
} as const;
export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

export const FileType = {
  PDF: 'PDF',
  DOC: 'DOC',
  PPT: 'PPT',
  IMAGE: 'IMAGE',
  ZIP: 'ZIP',
  OTHER: 'OTHER',
} as const;
export type FileType = (typeof FileType)[keyof typeof FileType];

export const ApprovalStatus = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
} as const;
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const ResourceSort = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  POPULAR: 'popular',
} as const;
export type ResourceSort = (typeof ResourceSort)[keyof typeof ResourceSort];
