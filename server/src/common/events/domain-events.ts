/**
 * Cross-module domain events (`@nestjs/event-emitter`). Producers (resource,
 * chat, ...) emit these and know nothing about who listens; the notification
 * module is one consumer. Keep payloads plain, serializable ids/strings.
 */
export const DomainEvents = {
  RESOURCE_APPROVED: 'resource.approved',
  RESOURCE_REJECTED: 'resource.rejected',
  RESOURCE_REMOVED: 'resource.removed',
  POST_UPVOTED: 'post.upvoted',
  RESOURCE_CITED: 'resource.cited',
  CONTRIBUTOR_APPLICATION_APPROVED: 'contributor_application.approved',
  CONTRIBUTOR_APPLICATION_REJECTED: 'contributor_application.rejected',
  MENTORSHIP_REQUESTED: 'mentorship.requested',
  MENTORSHIP_ACCEPTED: 'mentorship.accepted',
  MENTORSHIP_DECLINED: 'mentorship.declined',
  MENTORSHIP_COMPLETED: 'mentorship.completed',
  CHAT_MESSAGE_RECEIVED: 'chat.message.received',
  USER_WARNED: 'moderation.user_warned',
  CHAT_CONVERSATION_READ: 'chat.conversation.read',
} as const;

export interface ResourceApprovedEvent {
  resourceId: string;
  title: string;
  uploaderId: string;
}

export interface ResourceRejectedEvent {
  resourceId: string;
  title: string;
  uploaderId: string;
  reason: string;
}

/** An APPROVED resource was soft-deleted (reputation must be reversed). */
export interface ResourceRemovedEvent {
  resourceId: string;
  uploaderId: string;
}

/** The AI assistant cited a resource in an answer to someone else. */
export interface ResourceCitedEvent {
  resourceId: string;
  uploaderId: string;
  /** The user whose question produced the citation. */
  citedForUserId: string;
}

/** A user newly upvoted someone else's post (not emitted on un-upvote). */
export interface PostUpvotedEvent {
  postId: string;
  authorId: string;
  voterId: string;
}

/** Emitted only when the receiver is NOT currently viewing the conversation. */
export interface ChatMessageReceivedEvent {
  conversationId: string;
  senderId: string;
  receiverId: string;
  preview: string;
}

/** An admin upheld a report and issued a warning (BACKLOG.md E16). */
export interface UserWarnedEvent {
  userId: string;
  note?: string;
}

/** The user marked everything in a conversation as seen. */
export interface ChatConversationReadEvent {
  userId: string;
  conversationId: string;
}

export interface ContributorApplicationReviewedEvent {
  applicantId: string;
  applicationId: string;
  /** Present on rejection. */
  reason?: string;
}

interface MentorshipEventBase {
  mentorshipId: string;
  mentorId: string;
  menteeId: string;
}

export interface MentorshipRequestedEvent extends MentorshipEventBase {
  topic: string;
}

export interface MentorshipAcceptedEvent extends MentorshipEventBase {
  conversationId: string;
}

export interface MentorshipDeclinedEvent extends MentorshipEventBase {
  reason?: string;
}

export interface MentorshipCompletedEvent extends MentorshipEventBase {
  /** Who ended it (mentor or mentee). */
  completedBy: string;
}
