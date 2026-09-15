import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import type { ChatMessageDto } from "../types/ai-chat.dto";

interface UseChatPageInitOptions {
  sendMessage: (dto: ChatMessageDto) => void;
}

export function useChatPageInit({ sendMessage }: UseChatPageInitOptions) {
  const location = useLocation();
  const promptFiredRef = useRef(false);

  useEffect(() => {
    const initialPrompt = location.state?.initialPrompt as string | undefined;
    if (initialPrompt?.trim() && !promptFiredRef.current) {
      promptFiredRef.current = true;
      sendMessage({ message: initialPrompt.trim() });
      window.history.replaceState({}, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}