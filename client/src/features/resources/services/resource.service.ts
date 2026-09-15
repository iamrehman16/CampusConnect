// resource/services/resource.service.ts
import type {
  CreateResourceDto,
  UpdateResourceDto,
  Resource,
  ResourceFilterParams,
  UploadSignatureResponse,
  CloudinaryUploadResult,
  CreateResourcePayload,
} from "../types/resource.dto";
import type { PaginatedResult } from "@/shared/types/api.types";
import api from "@/shared/api/axios.instance";

export class ResourceService {
  // ─── Public ───────────────────────────────────────────────────────────────

  // GET /resources — approved resources with filters
  // backend forces approvalStatus: APPROVED on this endpoint
  async getResources(
    params: ResourceFilterParams,
  ): Promise<PaginatedResult<Resource>> {
    const { data } = await api.get<PaginatedResult<Resource>>("/resources", {
      params,
    });
    return data;
  }

  // GET /resources/:id — single approved resource
  async getResourceById(id: string): Promise<Resource> {
    const { data } = await api.get<Resource>(`/resources/${id}`);
    return data;
  }

  // GET /resources/:id/download — backend returns a redirect to Cloudinary signed url
  // we hit the endpoint and let the browser follow the redirect
  async downloadResource(id: string): Promise<void> {
    const { data } = await api.get<{ url: string }>(
      `/resources/${id}/download`,
    );

    const link = document.createElement("a");
    link.href = data.url;

    // This ensures the browser triggers a "Save As" behavior
    link.setAttribute("download", "");

    // Append, click, and cleanup
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ─── Contributor ──────────────────────────────────────────────────────────

  // GET /resources/my — contributor's own resources regardless of approval status
  // backend reuses findAll with uploadedBy injected from JWT, mirrors that on frontend
  async getMyResources(
    params: ResourceFilterParams,
  ): Promise<PaginatedResult<Resource>> {
    const { data } = await api.get<PaginatedResult<Resource>>("/resources/my", {
      params,
    });
    return data;
  }

  async getResourcesByUser(
    id: string,
    params: ResourceFilterParams,
  ): Promise<PaginatedResult<Resource>> {
    const { data } = await api.get<PaginatedResult<Resource>>(
      `/resources/user/${id}`,
      { params },
    );
    return data;
  }

  // PATCH /resources/:id — contributor updating their own resource
  // backend checks ownership, only pending resources can be updated
  async updateResource(id: string, dto: UpdateResourceDto): Promise<Resource> {
    const { data } = await api.patch<Resource>(`/resources/${id}`, dto);
    return data;
  }

  // DELETE /resources/:id — contributor deleting their own resource
  async deleteResource(id: string): Promise<void> {
    await api.delete(`/resources/${id}`);
  }

  /**
   * Signed upload flow — 3 steps, fully encapsulated here.
   * Hook interface unchanged: still accepts { dto, file }.
   */
  async createResource(dto: CreateResourceDto, file: File): Promise<Resource> {
    // Step 1 — get signature from your backend
    const { data: signatureData } = await api.post<UploadSignatureResponse>(
      "/resources/upload-signature",
      { mimetype: file.type },
    );

    // Step 2 — upload directly to Cloudinary, bypassing your server
    const cloudinaryResult = await this.uploadToCloudinary(file, signatureData);

    // Step 3 — submit metadata + verified cloudinary result to your backend
    const payload: CreateResourcePayload = {
      // Academic metadata from the form
      ...dto,
      // Cloudinary result fields for server-side verification
      publicId: cloudinaryResult.public_id,
      secureUrl: cloudinaryResult.secure_url,
      cloudinarySignature: cloudinaryResult.signature,
      version: cloudinaryResult.version,
      format: cloudinaryResult.format,
      bytes: cloudinaryResult.bytes,
      originalName: file.name,
      cloudinaryResourceType: cloudinaryResult.resource_type,
    };

    const { data } = await api.post<Resource>("/resources", payload);
    return data;
  }

  /**
   * Direct upload to Cloudinary using signed params.
   * Private — called only by createResource.
   */
  private async uploadToCloudinary(
    file: File,
    signatureData: UploadSignatureResponse,
  ): Promise<CloudinaryUploadResult> {
    const {
      signature,
      timestamp,
      folder,
      cloudinaryResourceType,
      apiKey,
      cloudName,
    } = signatureData;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("folder", folder);
    formData.append("tags", `user_${folder.split("/").pop()},pending_approval`);

    // Cloudinary endpoint varies by resource type
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${cloudinaryResourceType}/upload`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Cloudinary upload failed: ${error?.error?.message ?? response.statusText}`,
      );
    }

    return response.json() as Promise<CloudinaryUploadResult>;
  }
}

const resourceService = new ResourceService();
export default resourceService;
