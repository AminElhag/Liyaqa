import type { UUID } from "./api";

export type FileCategory =
  | "MEMBER_PROFILE"
  | "INVOICE_RECEIPT"
  | "DOCUMENT"
  | "CLUB_LOGO"
  | "CLASS_IMAGE"
  | "OTHER";

export interface FileMetadata {
  id: UUID;
  originalName: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  url: string;
}

export interface FileUploadResponse {
  success: boolean;
  file?: FileMetadata;
  error?: string;
}

export interface FileQueryParams {
  category?: FileCategory;
  page?: number;
  size?: number;
}
