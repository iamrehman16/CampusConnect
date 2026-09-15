import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { chatService } from "../services/chat-service";
import { chatKeys } from "./chat-keys";
import { useNavigate } from "react-router-dom";
import { useCallback, useRef } from "react";
import { ROUTES } from "@/shared/constants/routes";

export function useConversationsQuery() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: () => chatService.getMyConversations(),
    staleTime: 1000 * 30, // 30s — socket events invalidate this anyway
  });
}

export function useMessagesQuery(conversationId: string) {
  // Anchor timestamp — set once on mount, never changes for this hook instance
  const beforeRef = useRef(new Date().toISOString());

  return useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: ({ pageParam = 1 }) =>
      chatService.getMessages({
        conversationId,
        page: pageParam,
        limit: 20,
        before: beforeRef.current, // anchor all pages to same point in time
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPage ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!conversationId,
    maxPages:3,
    staleTime: 0,
    refetchOnMount:true,
  });
}

export function useFindOrCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatService.findOrCreateConversation.bind(chatService),
    onSuccess: () => {
      // New conversation may have been created — refetch the list
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

export function useChatTrigger() {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useFindOrCreateConversation();

  const trigger = useCallback(
    async (participantId: string) => {
      const conversation = await mutateAsync({ participantId });
      navigate(`${ROUTES.CHAT}/${conversation.id}`);
    },
    [mutateAsync, navigate],
  );

  return { trigger, isPending };
}
