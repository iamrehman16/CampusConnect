export class UploadSignatureResponseDto {
  signature: string;
  timestamp: number;
  folder: string;
  cloudinaryResourceType: 'image' | 'raw';
  apiKey: string;
  cloudName: string;
}
