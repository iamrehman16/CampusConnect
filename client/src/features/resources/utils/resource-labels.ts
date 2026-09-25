import type { ResourceType } from "@/shared/types/enums";

/** Human labels for resource types (enum values are PascalCase ids). */
export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  Notes: "Notes",
  Slides: "Slides",
  Assignment: "Assignment",
  Lab: "Lab",
  PastPaper: "Past paper",
  Book: "Book",
  ResearchPaper: "Research paper",
  Other: "Other",
};
