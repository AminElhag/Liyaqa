import { api } from "../client";
import type { PageResponse } from "@/types/api";
import type {
  ClientNote,
  CreateClientNoteRequest,
  UpdateClientNoteRequest,
  ClientNoteQueryParams,
} from "@/types/platform/client-note";

/**
 * Get notes for a client organization
 */
export async function getClientNotes(
  organizationId: string,
  params: ClientNoteQueryParams = {}
): Promise<PageResponse<ClientNote>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  if (params.category) searchParams.set("category", params.category);

  return api
    .get(`api/platform/clients/${organizationId}/notes`, { searchParams })
    .json<PageResponse<ClientNote>>();
}

/**
 * Get a single note by ID
 */
export async function getClientNote(
  organizationId: string,
  noteId: string
): Promise<ClientNote> {
  return api
    .get(`api/platform/clients/${organizationId}/notes/${noteId}`)
    .json<ClientNote>();
}

/**
 * Create a new note for a client organization
 */
export async function createClientNote(
  organizationId: string,
  data: CreateClientNoteRequest
): Promise<ClientNote> {
  return api
    .post(`api/platform/clients/${organizationId}/notes`, { json: data })
    .json<ClientNote>();
}

/**
 * Update an existing note
 */
export async function updateClientNote(
  organizationId: string,
  noteId: string,
  data: UpdateClientNoteRequest
): Promise<ClientNote> {
  return api
    .put(`api/platform/clients/${organizationId}/notes/${noteId}`, { json: data })
    .json<ClientNote>();
}

/**
 * Delete a note
 */
export async function deleteClientNote(
  organizationId: string,
  noteId: string
): Promise<void> {
  await api.delete(`api/platform/clients/${organizationId}/notes/${noteId}`);
}

/**
 * Toggle pin status for a note
 */
export async function toggleClientNotePin(
  organizationId: string,
  noteId: string
): Promise<ClientNote> {
  return api
    .post(`api/platform/clients/${organizationId}/notes/${noteId}/toggle-pin`)
    .json<ClientNote>();
}
