export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

// Outside `all`: every incoming notification invalidates `all`, and the VAPID
// key never changes within a session.
export const pushPublicKeyKey = ["push-public-key"] as const;
