import { useCallback, useEffect, useRef, useState } from "react";
import { chatSocketService } from "../services/chat-socket.service";

const REEMIT_MS = 2500; // keep the peer's indicator alive while we type
const IDLE_STOP_MS = 3000; // stop signalling after this much inactivity
const PEER_EXPIRY_MS = 5000; // drop the indicator if a "stop" event is lost

/**
 * Typing indicator for one conversation.
 * - `isPeerTyping`: the other participant is typing right now.
 * - `notifyTyping` / `stopTyping`: call from the input on change / on send.
 */
export function useTypingIndicator(
  conversationId: string | undefined,
  currentUserId: string | undefined,
  isConnected: boolean,
) {
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const lastEmitRef = useRef(0);
  const isTypingRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTyping = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;
    if (!isTypingRef.current || !conversationId || !isConnected) return;

    isTypingRef.current = false;
    lastEmitRef.current = 0;
    chatSocketService.emitTyping(conversationId, false);
  }, [conversationId, isConnected]);

  const notifyTyping = useCallback(() => {
    if (!conversationId || !isConnected) return;

    const now = Date.now();
    if (!isTypingRef.current || now - lastEmitRef.current > REEMIT_MS) {
      isTypingRef.current = true;
      lastEmitRef.current = now;
      chatSocketService.emitTyping(conversationId, true);
    }

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(stopTyping, IDLE_STOP_MS);
  }, [conversationId, isConnected, stopTyping]);

  // Peer typing events.
  useEffect(() => {
    if (!conversationId || !isConnected) return;

    let expiry: ReturnType<typeof setTimeout> | null = null;
    const clear = () => {
      if (expiry) clearTimeout(expiry);
      expiry = null;
    };

    const off = chatSocketService.onTyping((event) => {
      if (
        event.conversationId !== conversationId ||
        event.userId === currentUserId
      ) {
        return;
      }
      clear();
      setIsPeerTyping(event.isTyping);
      if (event.isTyping) {
        expiry = setTimeout(() => setIsPeerTyping(false), PEER_EXPIRY_MS);
      }
    });

    return () => {
      off();
      clear();
      setIsPeerTyping(false);
    };
  }, [conversationId, currentUserId, isConnected]);

  // Tell the peer we stopped when leaving the conversation.
  useEffect(() => stopTyping, [stopTyping]);

  return { isPeerTyping, notifyTyping, stopTyping };
}
