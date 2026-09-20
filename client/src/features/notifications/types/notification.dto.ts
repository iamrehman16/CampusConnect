export type NotificationType =
  | "resource_approved"
  | "resource_rejected"
  | "new_message"
  | "contributor_application_approved"
  | "contributor_application_rejected";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** In-app route, built server-side per notification type. */
  link: string;
  /** Number of grouped events (e.g. unread messages in one conversation). */
  count: number;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}
