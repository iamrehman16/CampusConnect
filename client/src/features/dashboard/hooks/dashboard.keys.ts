export const dashboardKeys = {
  all: ["dashboard"] as const,
  myStats: () => [...dashboardKeys.all, "myStats"],
  publicStats: () => [...dashboardKeys.all, "publicStats"],
};
