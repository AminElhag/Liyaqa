import type { LocalizedText, UUID, PaginatedResponse } from "./api";

/**
 * Category of a client note.
 */
export type NoteCategory =
  | "GENERAL"
  | "TECHNICAL"
  | "BILLING"
  | "RELATIONSHIP"
  | "TROUBLESHOOTING";

/**
 * Client note entity.
 */
export interface ClientNote {
  id: UUID;
  organizationId: UUID;
  content: LocalizedText;
  category: NoteCategory;
  isPinned: boolean;
  createdById: UUID;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request to create a client note.
 */
export interface CreateClientNoteRequest {
  contentEn: string;
  contentAr?: string;
  category: NoteCategory;
  isPinned?: boolean;
}

/**
 * Request to update a client note.
 */
export interface UpdateClientNoteRequest {
  contentEn?: string;
  contentAr?: string;
  category?: NoteCategory;
  isPinned?: boolean;
}

/**
 * Query parameters for fetching client notes.
 */
export interface ClientNoteQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  category?: NoteCategory;
}

/**
 * Category options for UI.
 */
export const NOTE_CATEGORIES: { value: NoteCategory; labelEn: string; labelAr: string; color: string }[] = [
  { value: "GENERAL", labelEn: "General", labelAr: "عام", color: "slate" },
  { value: "TECHNICAL", labelEn: "Technical", labelAr: "تقني", color: "blue" },
  { value: "BILLING", labelEn: "Billing", labelAr: "فوترة", color: "emerald" },
  { value: "RELATIONSHIP", labelEn: "Relationship", labelAr: "علاقات", color: "purple" },
  { value: "TROUBLESHOOTING", labelEn: "Troubleshooting", labelAr: "استكشاف الأخطاء", color: "amber" },
];

/**
 * Get localized label for a note category.
 */
export function getNoteCategoryLabel(category: NoteCategory, locale: string): string {
  const cat = NOTE_CATEGORIES.find((c) => c.value === category);
  if (!cat) return category;
  return locale === "ar" ? cat.labelAr : cat.labelEn;
}

/**
 * Get color for a note category.
 */
export function getNoteCategoryColor(category: NoteCategory): string {
  const cat = NOTE_CATEGORIES.find((c) => c.value === category);
  return cat?.color ?? "slate";
}

// Re-export paginated type for convenience
export type ClientNotesResponse = PaginatedResponse<ClientNote>;
