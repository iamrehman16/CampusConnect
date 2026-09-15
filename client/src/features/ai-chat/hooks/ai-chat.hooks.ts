// hooks/ai-chat.hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiChatService } from "../services/ai-chat.service";
import { aiChatKeys } from "./ai-chat.keys";
import {
  getConversation,
  setConversation,
  clearConversation,
} from "../utils/ai-chat.cache";
import { generateId } from "../utils/generate-id";
import type {
  ChatMessageDto,
  ChatResponseDto,
  ConversationMessage,
} from "../types/ai-chat.dto";
// ---------------------------------------------------------------------------
// Mutation context — typed explicitly to avoid casting in onSuccess/onError
// ---------------------------------------------------------------------------
interface SendMessageContext {
  snapshot: ConversationMessage[];
  skeletonId: string;
}

// ---------------------------------------------------------------------------
// useConversation
// Treats the React Query cache as local state storage for the conversation.
// queryFn returns [] so it never hits the network; staleTime:Infinity keeps
// it frozen for the lifetime of the session.
// ---------------------------------------------------------------------------
export function useConversation() {
  return useQuery<ConversationMessage[]>({
    queryKey: aiChatKeys.conversation(),
    queryFn: () => [],
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: [],
  });
}

// ---------------------------------------------------------------------------
// useSendMessage
// Optimistic flow:
//   1. Append user bubble immediately (confirmed, isPending omitted)
//   2. Append skeleton assistant bubble (isPending: true) as placeholder
//   3. onSuccess → patch skeleton in-place with real response + citations
//   4. onError   → remove skeleton only; user bubble stays so they can retry
// ---------------------------------------------------------------------------
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation<
    ChatResponseDto,
    Error,
    ChatMessageDto,
    SendMessageContext
  >({
    mutationFn: (dto) => aiChatService.sendMessage(dto),

    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey: aiChatKeys.conversation() });

      const snapshot = getConversation(queryClient);
      const skeletonId = generateId();

      setConversation(queryClient, (prev) => [
        ...prev,
        { id: generateId(), role: "user", content: dto.message },
        { id: skeletonId, role: "assistant", content: "", isPending: true },
      ]);

      return { snapshot, skeletonId };
    },

    onSuccess: (response, _dto, { skeletonId }) => {
      setConversation(queryClient, (prev) =>
        prev.map((msg) =>
          msg.id === skeletonId
            ? {
                ...msg,
                content: response.answer,
                citations: response.citations,
                isPending: false,
              }
            : msg,
        ),
      );
    },

    onError: (_error, _dto, context) => {
      // context can be undefined if onMutate threw before returning
      if (!context) return;
      setConversation(queryClient, (prev) =>
        prev.filter((msg) => msg.id !== context.skeletonId),
      );
    },
  });
}

// ---------------------------------------------------------------------------
// useClearSession
// Fires the backend session delete (extracts userId from JWT server-side),
// then wipes the local conversation cache on success.
// ---------------------------------------------------------------------------
export function useClearSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => aiChatService.clearSession(),
    onSuccess: () => clearConversation(queryClient),
  });
}
