/**
 * Cross-module domain events (`@nestjs/event-emitter`). Producers (resource,
 * chat, ...) emit these and know nothing about who listens; the notification
 * module is one consumer. Keep payloads plain, serializable ids/strings.
 */
export const DomainEvents = {
  RESOURCE_APPROVED: 'resource.approved',
  RESOURCE_REJECTED: 'resource.rejected',
  CHAT_MESSAGE_RECEIVED: 'chat.message.received',
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

/** Emitted only when the receiver is NOT currently viewing the conversation. */
export interface ChatMessageReceivedEvent {
  conversationId: string;
  senderId: string;
  receiverId: string;
  preview: string;
}

/** The user marked everything in a conversation as seen. */
export interface ChatConversationReadEvent {
  userId: string;
  conversationId: string;
}
