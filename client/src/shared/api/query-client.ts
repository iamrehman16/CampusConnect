// shared/api/query-client.ts
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/shared/utils/api-error";
import toast from "react-hot-toast";

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => toast.error(getApiErrorMessage(error)),
  }),
  queryCache: new QueryCache({
    onError: (error) => toast.error(getApiErrorMessage(error)),
  }),
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // keep cache for 24h (must match persister maxAge)
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
    mutations: {
      retry: 0,
    },
  },
});
