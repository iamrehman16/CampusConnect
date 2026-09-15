import api from "@/shared/api/axios.instance";
import type {
  Conversation,
  ConversationParticipant,
  GetMessagesParams,
  Message,
  StartConversationDto,
} from "../types/chat-dto";
import type { PaginatedResult } from "@/shared/types/api.types";

type RawConversationParticipant = ConversationParticipant & { _id?: string };
type RawMessage = Message & { _id?: string };
type RawConversation = Conversation & { _id?: string; participants: RawConversationParticipant[]; lastMessage: RawMessage | null };

function normalizeParticipant(
  participant: RawConversationParticipant,
): ConversationParticipant {
  return {
    ...participant,
    id: participant.id ?? participant._id ?? "",
  };
}

function normalizeMessage(message: RawMessage): Message {
  return {
    ...message,
    id: message.id ?? message._id ?? "",
    seenAt: message.seenAt ? new Date(message.seenAt) : null,
    createdAt: new Date(message.createdAt),
    updatedAt: new Date(message.updatedAt),
  };
}

function normalizeConversation(conversation: RawConversation): Conversation {
  return {
    ...conversation,
    id: conversation.id ?? conversation._id ?? "",
    participants: conversation.participants.map(normalizeParticipant),
    lastMessage: conversation.lastMessage
      ? normalizeMessage(conversation.lastMessage)
      : null,
  };
}

export class ChatService {
  async getMyConversations(): Promise<Conversation[]> {
    const { data } = await api.get<RawConversation[]>("conversations");
    return data.map(normalizeConversation);
  }

  async findOrCreateConversation(
    dto: StartConversationDto,
  ): Promise<Conversation> {
    const { data } = await api.post<RawConversation>("conversations", dto);
    return normalizeConversation(data);
  }

  async getMessages(
    params: GetMessagesParams,
  ): Promise<PaginatedResult<Message>> {
    const { data } = await api.get<PaginatedResult<RawMessage>>("conversations/messages", {
      params,
    });
    return {
      ...data,
      data: data.data.map(normalizeMessage),
    };
  }
}

export const chatService = new ChatService();
