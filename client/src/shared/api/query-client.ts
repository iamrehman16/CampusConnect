// shared/api/query-client.ts
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/shared/utils/api-error";
import toast from "react-hot-toast";

// Read-only offline mode (BACKLOG.md J3): while the browser is offline the
// banner already says so, so failed reads must not each raise a toast, and a
// failed write gets one clear, de-duplicated message.
const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) =>
      isOffline()
        ? toast.error("You're offline. This needs a connection.", { id: "offline-write" })
        : toast.error(getApiErrorMessage(error)),
  }),
  queryCache: new QueryCache({
    onError: (error) => {
      if (!isOffline()) toast.error(getApiErrorMessage(error));
    },
  }),
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // keep cache for 24h (must match persister maxAge)
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
    mutations: {
      retry: 0,
      // Fail fast offline instead of silently queueing the write to replay
      // later: there is deliberately no offline write mode.
      networkMode: "always",
    },
  },
});
