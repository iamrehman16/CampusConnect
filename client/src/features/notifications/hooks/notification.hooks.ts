import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import notificationService from "../services/notification.service";
import { notificationKeys } from "./notification.keys";
import { PAGE_LIMIT } from "@/shared/types/api.types";

export const useNotifications = (enabled: boolean) =>
  useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      notificationService.list({ page: pageParam, limit: PAGE_LIMIT }),
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPage ? lastPage.page + 1 : undefined,
    enabled,
  });

export const useUnreadNotificationCount = () =>
  useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationService.unreadCount(),
    staleTime: 1000 * 60,
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
};
