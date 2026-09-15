import { IsIn } from 'class-validator';

// Mirrors FileValidationPipe exactly — single source of truth
export const ALLOWED_MIMETYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'text/plain',
] as const;

export type AllowedMimetype = (typeof ALLOWED_MIMETYPES)[number];

export class RequestUploadSignatureDto {
  @IsIn(ALLOWED_MIMETYPES)
  mimetype: AllowedMimetype;
}
