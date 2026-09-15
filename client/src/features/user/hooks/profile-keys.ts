export const profileKeys = {
  all: () => ["profile"] as const,
  me: () => [...profileKeys.all(), "me"] as const,
  user: (id: string) => [...profileKeys.all(), "user", id] as const,
};