// useStreamRefs.ts — inferred from usage, adding 2 new refs
import { useCallback, useRef } from "react";

export function useStreamRefs() {
  const accRef    = useRef("");
  const queueRef  = useRef<string[]>([]);
  const renderRef = useRef("");
  const flushRef  = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const fetchCompleteRef = useRef(false); // true once event.type === "done" received
  const pollCancelRef    = useRef(false); // cancels waitForDrainThenCommit poll
  const citationsRef     = useRef<any[] | undefined>(undefined); // tracks citations payload

  const reset = useCallback(() => {
    accRef.current         = "";
    queueRef.current       = [];
    renderRef.current      = "";
    fetchCompleteRef.current = false;
    pollCancelRef.current    = false;
    citationsRef.current     = undefined;
    // flushRef cleared by clearInterval inside commit fns, not here
  }, []);

  return { accRef, queueRef, renderRef, flushRef, fetchCompleteRef, pollCancelRef, citationsRef, reset };
}