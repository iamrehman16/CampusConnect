// useStreamRefs.ts — inferred from usage, adding 2 new refs
import { useCallback, useRef } from "react";
import type { Citation, RetrievalStatus } from "../types/ai-chat.dto";

export function useStreamRefs() {
  const accRef    = useRef("");
  const queueRef  = useRef<string[]>([]);
  const renderRef = useRef("");
  const flushRef  = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const fetchCompleteRef = useRef(false); // true once event.type === "done" received
  const pollCancelRef    = useRef(false); // cancels waitForDrainThenCommit poll
  const citationsRef     = useRef<Citation[] | undefined>(undefined); // tracks citations payload
  const retrievalStatusRef = useRef<RetrievalStatus | undefined>(undefined); // tracks retrieval status payload

  const reset = useCallback(() => {
    accRef.current         = "";
    queueRef.current       = [];
    renderRef.current      = "";
    fetchCompleteRef.current = false;
    pollCancelRef.current    = false;
    citationsRef.current     = undefined;
    retrievalStatusRef.current = undefined;
    // flushRef cleared by clearInterval inside commit fns, not here
  }, []);

  return { accRef, queueRef, renderRef, flushRef, fetchCompleteRef, pollCancelRef, citationsRef, retrievalStatusRef, reset };
}