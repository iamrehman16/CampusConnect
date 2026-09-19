// useStreamMessage.ts — full updated file
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { aiChatService } from "../services/ai-chat.service";
import { setConversation } from "../utils/ai-chat.cache";
import { generateId } from "../utils/generate-id";
import { useStreamRefs } from "./useStreamRefs";
import { useDrainQueue } from "./useDrainQueue";
import type { ChatMessageDto, ConversationMessage } from "../types/ai-chat.dto";

interface UseStreamMessageOptions {
  // The thread this send targets — NEW_THREAD_KEY while composing a brand
  // new chat with no server-assigned id yet (BACKLOG.md B7).
  conversationId: string;
  // Fired once the server resolves a real conversationId for a send that
  // went out without one (a new thread's first message). Caller is
  // responsible for migrating the cache entry and navigating.
  onThreadResolved?: (conversationId: string) => void;
}

export function useStreamMessage({
  conversationId,
  onThreadResolved,
}: UseStreamMessageOptions) {
  const queryClient = useQueryClient();
  const [streamingBubble, setStreamingBubble] =
    useState<ConversationMessage | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isFetching, setIsFetching] = useState(false); // fetch specifically live

  const refs = useStreamRefs();
  const { accRef, queueRef, fetchCompleteRef } = refs;
  const currentBubbleIdRef = useRef<string>(""); // needed by stop() for flushAndCommit path

  const abortRef = useRef<AbortController | undefined>(undefined); // lives here, locally

  // Kept live across a send in flight — the drain/commit callbacks below
  // are created once per useDrainQueue call, so a ref (not the plain
  // `conversationId` string) is what lets a mid-stream thread resolution
  // (see the "citations" branch below) land in the right cache entry.
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  const {
    startDrainInterval,
    flushQueueInstant,
    waitForDrainThenCommit,
    commitOnAbort,
    flushAndCommit,
    cleanup,
  } = useDrainQueue({ refs, setStreamingBubble, setIsStreaming, conversationIdRef });

  // Bug 1 fix: when tab becomes visible, instantly flush any frozen queue
  // so the user sees the full response immediately rather than a slow catch-up
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        flushQueueInstant(); // no-op if queue is empty
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [flushQueueInstant]);

  // Bug 2 fix: stop behaviour depends on whether the fetch is still live
  const stop = useCallback(() => {
    if (!fetchCompleteRef.current) {
      // Fetch still open — abort it; commitOnAbort handles UI cleanup via signal listener
      abortRef.current?.abort();
    } else {
      // Fetch done, animation still playing — skip remaining animation and commit now
      flushAndCommit(currentBubbleIdRef.current);
    }
  }, [abortRef, fetchCompleteRef, flushAndCommit]);

  const sendMessage = useCallback(
    async (dto: ChatMessageDto) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userBubbleId = generateId();
      const assistantBubbleId = generateId();
      currentBubbleIdRef.current = assistantBubbleId;

      setConversation(queryClient, conversationIdRef.current, (prev) => [
        ...prev,
        { id: userBubbleId, role: "user", content: dto.message },
      ]);

      refs.reset(); // resets fetchCompleteRef, pollCancelRef, acc, queue, render
      setStreamingBubble({
        id: assistantBubbleId,
        role: "assistant",
        content: "",
        isPending: true,
      });
      setIsStreaming(true);
      setIsFetching(true);
      startDrainInterval();

      const handleAbort = () => {
        commitOnAbort(assistantBubbleId);
      };
      controller.signal.addEventListener("abort", handleAbort);

      try {
        for await (const event of aiChatService.streamMessage(
          dto,
          controller.signal,
        )) {
          if (event.type === "token") {
            accRef.current += event.token;
            queueRef.current.push(...event.token.split(""));
          } else if (event.type === "citations") {
            refs.citationsRef.current = event.citations;
            refs.retrievalStatusRef.current = event.retrievalStatus;
            setStreamingBubble((prev) =>
              prev
                ? {
                    ...prev,
                    citations: event.citations,
                    retrievalStatus: event.retrievalStatus,
                  }
                : prev,
            );
            // A new thread's first message goes out without a
            // conversationId — this is where the server hands one back.
            // Update the drain/commit ref immediately so the streaming
            // bubble that's about to be committed lands in the real
            // thread's cache entry, not the "new" placeholder.
            if (event.conversationId !== conversationIdRef.current) {
              conversationIdRef.current = event.conversationId;
              onThreadResolved?.(event.conversationId);
            }
          } else if (event.type === "done") {
            fetchCompleteRef.current = true; // fetch is complete, only animation remains
            setIsFetching(false);
            waitForDrainThenCommit(assistantBubbleId);
            return;
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      } catch (err: unknown) {
        const isAbort =
          err instanceof DOMException && err.name === "AbortError";
        if (!isAbort) {
          cleanup();
        }
        setIsFetching(false);
      } finally {
        controller.signal.removeEventListener("abort", handleAbort);
      }
    },
    [
      queryClient,
      refs,
      accRef,
      queueRef,
      abortRef,
      fetchCompleteRef,
      startDrainInterval,
      waitForDrainThenCommit,
      commitOnAbort,
      cleanup,
      onThreadResolved,
    ],
  );

  return { sendMessage, stop, isStreaming, isFetching, streamingBubble };
}
