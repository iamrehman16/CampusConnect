import type { FileType, ResourceType } from "@/shared/types/enums";

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

/** Human labels for file formats. */
export const FILE_TYPE_LABEL: Record<FileType, string> = {
  PDF: "PDF",
  DOC: "Word document",
  PPT: "Presentation",
  IMAGE: "Image",
  ZIP: "Archive",
  OTHER: "File",
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
