export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  resourceAnalytics: () => [...adminKeys.all, 'resource-analytics'] as const,
  userGrowth: () => [...adminKeys.all, 'user-growth'] as const,
};