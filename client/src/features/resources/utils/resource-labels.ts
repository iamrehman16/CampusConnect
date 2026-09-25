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

/**
 * First-page preview image for PDFs/images stored on Cloudinary's image
 * pipeline (PDFs are uploaded as resource_type "image"): Cloudinary renders
 * page 1 as a JPG via the pg_1 transformation. Undefined for anything it
 * can't render (docs, slides, archives, raw uploads).
 */
export function resourcePreviewUrl(
  fileUrl: string,
  fileType: FileType,
  width = 1000,
): string | undefined {
  if (!/res\.cloudinary\.com\/.+\/image\/upload\//.test(fileUrl)) return undefined;
  if (fileType !== "PDF" && fileType !== "IMAGE") return undefined;
  const transform = fileType === "PDF" ? `pg_1,w_${width},f_jpg` : `w_${width},f_auto`;
  const url = fileUrl.replace(/\/image\/upload\//, `/image/upload/${transform}/`);
  return fileType === "PDF" ? url.replace(/\.pdf$/i, ".jpg") : url;
}
