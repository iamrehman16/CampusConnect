import { NotificationType } from './enums/notification-type.enum';

/**
 * Typed registry: every notification type declares its payload shape and a
 * builder that turns it into display content. Adding a type (e.g. mentorship
 * request) = one enum value + one payload + one builder; the compiler forces
 * all three (the mapped `notificationBuilders` type is exhaustive).
 */
export interface NotificationPayloads {
  [NotificationType.RESOURCE_APPROVED]: { resourceId: string; title: string };
  [NotificationType.RESOURCE_REJECTED]: {
    resourceId: string;
    title: string;
    reason: string;
  };
  [NotificationType.NEW_MESSAGE]: {
    conversationId: string;
    senderName: string;
    preview: string;
  };
}

export interface NotificationContent {
  title: string;
  body: string;
  /** In-app route the client navigates to on click. */
  link: string;
  /**
   * When set, an existing UNREAD notification with the same key is updated
   * (count incremented) instead of a new one being created — used to group
   * e.g. many messages in one conversation into a single row.
   */
  dedupeKey?: string;
}

export const newMessageDedupeKey = (conversationId: string): string =>
  `${NotificationType.NEW_MESSAGE}:${conversationId}`;

type Builders = {
  [T in NotificationType]: (
    payload: NotificationPayloads[T],
  ) => NotificationContent;
};

export const notificationBuilders: Builders = {
  [NotificationType.RESOURCE_APPROVED]: ({ resourceId, title }) => ({
    title: 'Resource approved',
    body: `"${title}" is now live and searchable.`,
    link: `/resources/${resourceId}`,
  }),
  [NotificationType.RESOURCE_REJECTED]: ({ title, reason }) => ({
    title: 'Resource rejected',
    body: `"${title}" was rejected: ${reason}`,
    link: '/profile',
  }),
  [NotificationType.NEW_MESSAGE]: ({
    conversationId,
    senderName,
    preview,
  }) => ({
    title: senderName,
    body: preview,
    link: `/chat/${conversationId}`,
    dedupeKey: newMessageDedupeKey(conversationId),
  }),
};
