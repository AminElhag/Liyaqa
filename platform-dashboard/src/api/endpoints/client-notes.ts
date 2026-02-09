import api from '@/api/client'
import type {
  PageResponse,
  ClientNote,
  CreateClientNoteRequest,
  UpdateClientNoteRequest,
  ClientNoteQueryParams,
} from '@/types'

/**
 * Get notes for a client organization.
 */
export async function getClientNotes(
  organizationId: string,
  queryParams: ClientNoteQueryParams = {},
): Promise<PageResponse<ClientNote>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection
  if (queryParams.category) params.category = queryParams.category

  return api
    .get<PageResponse<ClientNote>>(`api/platform/clients/${organizationId}/notes`, {
      params,
    })
    .then((r) => r.data)
}

/**
 * Get a single note by ID.
 */
export async function getClientNote(
  organizationId: string,
  noteId: string,
): Promise<ClientNote> {
  return api
    .get<ClientNote>(`api/platform/clients/${organizationId}/notes/${noteId}`)
    .then((r) => r.data)
}

/**
 * Create a new note for a client organization.
 */
export async function createClientNote(
  organizationId: string,
  data: CreateClientNoteRequest,
): Promise<ClientNote> {
  return api
    .post<ClientNote>(`api/platform/clients/${organizationId}/notes`, data)
    .then((r) => r.data)
}

/**
 * Update an existing note.
 */
export async function updateClientNote(
  organizationId: string,
  noteId: string,
  data: UpdateClientNoteRequest,
): Promise<ClientNote> {
  return api
    .put<ClientNote>(`api/platform/clients/${organizationId}/notes/${noteId}`, data)
    .then((r) => r.data)
}

/**
 * Delete a note.
 */
export async function deleteClientNote(
  organizationId: string,
  noteId: string,
): Promise<void> {
  await api.delete(`api/platform/clients/${organizationId}/notes/${noteId}`)
}

/**
 * Toggle pin status for a note.
 */
export async function toggleClientNotePin(
  organizationId: string,
  noteId: string,
): Promise<ClientNote> {
  return api
    .post<ClientNote>(
      `api/platform/clients/${organizationId}/notes/${noteId}/toggle-pin`,
    )
    .then((r) => r.data)
}
