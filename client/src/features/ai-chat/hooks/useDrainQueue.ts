// useDrainQueue.ts — full updated file
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setConversation } from "../utils/ai-chat.cache";
import type { ConversationMessage } from "../types/ai-chat.dto";
import type { useStreamRefs } from "./useStreamRefs";

interface UseDrainQueueOptions {
  refs: ReturnType<typeof useStreamRefs>;
  setStreamingBubble: React.Dispatch<React.SetStateAction<ConversationMessage | null>>;
  setIsStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  // Cache key to commit into (BACKLOG.md B7) — the caller's current
  // conversationId, or NEW_THREAD_KEY while a new thread's first message
  // is still in flight and no real id has come back yet.
  conversationIdRef: React.RefObject<string>;
}

export function useDrainQueue({ refs, setStreamingBubble, setIsStreaming, conversationIdRef }: UseDrainQueueOptions) {
  const queryClient = useQueryClient();
  const { accRef, queueRef, renderRef, flushRef, pollCancelRef, citationsRef, retrievalStatusRef } = refs;

  const startDrainInterval = useCallback(() => {
    let frameCount = 0;

    const drainFrame = () => {
      if (queueRef.current.length === 0) {
        flushRef.current = requestAnimationFrame(drainFrame);
        return;
      }

      const targetFrames = 48; // 0.8s at 60fps
      const charsPerFrame = Math.max(1, Math.floor(queueRef.current.length / targetFrames));

      let charsToDrain = charsPerFrame;
      let newChars = "";
      while (charsToDrain > 0 && queueRef.current.length > 0) {
        newChars += queueRef.current.shift()!;
        charsToDrain--;
      }

      renderRef.current += newChars;
      frameCount++;

      // Batch state updates to roughly 20fps or on word boundaries to prevent 
      // excessive Markdown re-parsing jank, while keeping the typewriter feel
      if (
        newChars.includes(" ") || 
        newChars.includes("\n") || 
        frameCount % 3 === 0 || 
        queueRef.current.length === 0
      ) {
        setStreamingBubble((prev) => prev ? { ...prev, content: renderRef.current } : prev);
      }

      flushRef.current = requestAnimationFrame(drainFrame);
    };

    flushRef.current = requestAnimationFrame(drainFrame);
  }, [flushRef, queueRef, renderRef, setStreamingBubble]);

  // Dumps all queued chars at once — used on tab-visible and stop-while-animating
  const flushQueueInstant = useCallback(() => {
    if (queueRef.current.length === 0) return;
    renderRef.current += queueRef.current.join("");
    queueRef.current = [];
    setStreamingBubble((prev) => prev ? { ...prev, content: renderRef.current } : prev);
  }, [queueRef, renderRef, setStreamingBubble]);

  // NOTE: no reset() call — sendMessage owns reset() at the start of each send.
  // Calling reset() here would clear pollCancelRef before the poll loop sees it → double commit.
  const commitFinal = useCallback((assistantBubbleId: string) => {
    if (flushRef.current !== null) cancelAnimationFrame(flushRef.current!);
    setConversation(queryClient, conversationIdRef.current, (prev) => [
      ...prev,
      { 
        id: assistantBubbleId, 
        role: "assistant" as const, 
        content: accRef.current,
        isPending: false,
        citations: citationsRef.current,
        retrievalStatus: retrievalStatusRef.current
      },
    ]);
    setStreamingBubble(null);
    setIsStreaming(false);
  }, [queryClient, accRef, flushRef, citationsRef, retrievalStatusRef, conversationIdRef, setStreamingBubble, setIsStreaming]);

  const waitForDrainThenCommit = useCallback((assistantBubbleId: string) => {
    const poll = () => {
      if (pollCancelRef.current) return;          // abort or flushAndCommit cancelled us
      if (queueRef.current.length === 0) {
        commitFinal(assistantBubbleId);
      } else {
        setTimeout(poll, 18);
      }
    };
    poll();
  }, [queueRef, pollCancelRef, commitFinal]);

  const commitOnAbort = useCallback((assistantBubbleId: string) => {
    pollCancelRef.current = true;                  // stop any pending poll
    if (flushRef.current !== null) cancelAnimationFrame(flushRef.current!);
    queueRef.current = [];
    setConversation(queryClient, conversationIdRef.current, (prev) => [
      ...prev,
      { 
        id: assistantBubbleId, 
        role: "assistant" as const, 
        content: renderRef.current,
        isPending: false,
        citations: citationsRef.current,
        retrievalStatus: retrievalStatusRef.current
      },
    ]);
    setStreamingBubble(null);
    setIsStreaming(false);
  }, [queryClient, renderRef, flushRef, queueRef, pollCancelRef, citationsRef, retrievalStatusRef, conversationIdRef, setStreamingBubble, setIsStreaming]);

  // Stop while fetch is done but animation still playing — skip remaining animation
  const flushAndCommit = useCallback((assistantBubbleId: string) => {
    pollCancelRef.current = true;
    if (flushRef.current !== null) cancelAnimationFrame(flushRef.current!);
    queueRef.current = [];                         // discard un-animated chars
    commitFinal(assistantBubbleId);                // commits accRef (full content)
  }, [pollCancelRef, flushRef, queueRef, commitFinal]);

  const cleanup = useCallback(() => {
    if (flushRef.current !== null) cancelAnimationFrame(flushRef.current!);
    setStreamingBubble(null);
    setIsStreaming(false);
  }, [flushRef, setStreamingBubble, setIsStreaming]);

  return { startDrainInterval, flushQueueInstant, waitForDrainThenCommit, commitOnAbort, flushAndCommit, cleanup };
}