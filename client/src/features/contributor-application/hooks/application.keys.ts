import type { ApplicationStatus } from "../types/application.dto";

export const applicationKeys = {
  all: ["contributor-applications"] as const,
  mine: () => [...applicationKeys.all, "mine"] as const,
  admin: (status: ApplicationStatus) =>
    [...applicationKeys.all, "admin", status] as const,
  adminAll: () => [...applicationKeys.all, "admin"] as const,
};
