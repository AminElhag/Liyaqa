import { api } from "./client";
import type { UUID } from "../types/api";
import type { FileMetadata, FileUploadResponse, FileCategory } from "../types/files";

const BASE_URL = "api/files";

/**
 * Upload a file with optional category and reference
 */
export async function uploadFile(
  file: File,
  category: FileCategory = "OTHER",
  referenceId?: UUID
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);
  if (referenceId) formData.append("referenceId", referenceId);

  return api.post(`${BASE_URL}/upload`, { body: formData }).json();
}

/**
 * Upload a member profile photo
 */
export async function uploadMemberPhoto(
  memberId: UUID,
  file: File
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`${BASE_URL}/members/${memberId}/photo`, { body: formData }).json();
}

/**
 * Upload an invoice receipt
 */
export async function uploadInvoiceReceipt(
  invoiceId: UUID,
  file: File
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`${BASE_URL}/invoices/${invoiceId}/receipt`, { body: formData }).json();
}

/**
 * Get file metadata
 */
export async function getFileMetadata(fileId: UUID): Promise<FileMetadata> {
  return api.get(`${BASE_URL}/${fileId}/metadata`).json();
}

/**
 * Delete a file
 */
export async function deleteFile(fileId: UUID): Promise<void> {
  await api.delete(`${BASE_URL}/${fileId}`);
}

/**
 * Get the download URL for a file
 */
export function getFileUrl(fileId: UUID): string {
  return `${BASE_URL}/${fileId}`;
}
