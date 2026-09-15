// useChatScroll.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { ConversationMessage } from "../types/ai-chat.dto";

interface UseChatScrollOptions {
  messages: ConversationMessage[];
  streamingContent: string | undefined;
  isStreaming: boolean;
}

export function useChatScroll({ messages, streamingContent, isStreaming }: UseChatScrollOptions) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef          = useRef<HTMLDivElement>(null);
  const isPinnedRef        = useRef(true);
  const rafRef             = useRef<number | null>(null); // pending rAF handle
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const atBottom = scrollHeight - scrollTop - clientHeight < 80;
      isPinnedRef.current = atBottom;
      setShowScrollBtn(!atBottom);
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
      return () => container.removeEventListener("scroll", handleScroll);
    }
  });

  // Throttled scroll: coalesces rapid calls into one per animation frame
  const scheduleScroll = useCallback((behavior: ScrollBehavior) => {
    if (rafRef.current !== null) return;           // already queued for this frame
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!isPinnedRef.current) return;            // user scrolled away — respect it
      bottomRef.current?.scrollIntoView({ behavior });
    });
  }, []);

  // Cancel any pending rAF on unmount
  useEffect(() => {
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    if (!isPinnedRef.current) return;
    scheduleScroll(isStreaming ? "instant" : "smooth");
  }, [messages, streamingContent, isStreaming, scheduleScroll]);

  const scrollToBottom = useCallback(() => {
    isPinnedRef.current = true;
    setShowScrollBtn(false);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return { scrollContainerRef, bottomRef, showScrollBtn, scrollToBottom };
}