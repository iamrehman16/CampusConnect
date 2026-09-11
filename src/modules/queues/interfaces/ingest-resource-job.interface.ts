export interface IngestResourceJobPayload {
  resourceId: string;
  fileUrl: string;
  fileType: string;
  cloudinaryResourceType: string;
  title: string;
  subject: string;
  course: string;
  semester: number;
  resourceType: string;
}
