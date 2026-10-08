import type { Types } from 'mongoose';
import type { IngestResourceJobPayload } from '../interfaces/ingest-resource-job.interface';

export interface IngestableResource {
  _id: Types.ObjectId;
  fileUrl: string;
  fileType: string;
  cloudinaryResourceType: string;
  title: string;
  resourceType: string;
  semester: number;
  course: string;
  subject: string;
}

export function toIngestionPayload(
  resource: IngestableResource,
): IngestResourceJobPayload {
  return {
    resourceId: resource._id.toString(),
    fileUrl: resource.fileUrl,
    fileType: resource.fileType,
    cloudinaryResourceType: resource.cloudinaryResourceType,
    title: resource.title,
    resourceType: resource.resourceType,
    semester: resource.semester,
    course: resource.course,
    subject: resource.subject,
  };
}
