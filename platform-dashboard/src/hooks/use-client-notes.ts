import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClientNotes,
  getClientNote,
  createClientNote,
  updateClientNote,
  deleteClientNote,
  toggleClientNotePin,
} from '@/api/endpoints/client-notes'
import type {
  ClientNoteQueryParams,
  CreateClientNoteRequest,
  UpdateClientNoteRequest,
} from '@/types'

// Query key factory
export const clientNoteKeys = {
  all: ['client-notes'] as const,
  lists: () => [...clientNoteKeys.all, 'list'] as const,
  list: (organizationId: string, filters: ClientNoteQueryParams) =>
    [...clientNoteKeys.lists(), organizationId, filters] as const,
  details: () => [...clientNoteKeys.all, 'detail'] as const,
  detail: (organizationId: string, noteId: string) =>
    [...clientNoteKeys.details(), organizationId, noteId] as const,
}

// ============================================
// Query hooks
// ============================================

export function useClientNotes(
  organizationId: string,
  params: ClientNoteQueryParams = {},
) {
  return useQuery({
    queryKey: clientNoteKeys.list(organizationId, params),
    queryFn: () => getClientNotes(organizationId, params),
    staleTime: 120_000,
    enabled: !!organizationId,
  })
}

export function useClientNote(organizationId: string, noteId: string) {
  return useQuery({
    queryKey: clientNoteKeys.detail(organizationId, noteId),
    queryFn: () => getClientNote(organizationId, noteId),
    staleTime: 60_000,
    enabled: !!organizationId && !!noteId,
  })
}

// ============================================
// Mutation hooks
// ============================================

export function useCreateClientNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      data,
    }: {
      organizationId: string
      data: CreateClientNoteRequest
    }) => createClientNote(organizationId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...clientNoteKeys.lists(), variables.organizationId],
      })
    },
  })
}

export function useUpdateClientNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      noteId,
      data,
    }: {
      organizationId: string
      noteId: string
      data: UpdateClientNoteRequest
    }) => updateClientNote(organizationId, noteId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientNoteKeys.detail(variables.organizationId, variables.noteId),
      })
      queryClient.invalidateQueries({
        queryKey: [...clientNoteKeys.lists(), variables.organizationId],
      })
    },
  })
}

export function useDeleteClientNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      noteId,
    }: {
      organizationId: string
      noteId: string
    }) => deleteClientNote(organizationId, noteId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...clientNoteKeys.lists(), variables.organizationId],
      })
    },
  })
}

export function useToggleClientNotePin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      organizationId,
      noteId,
    }: {
      organizationId: string
      noteId: string
    }) => toggleClientNotePin(organizationId, noteId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: clientNoteKeys.detail(variables.organizationId, variables.noteId),
      })
      queryClient.invalidateQueries({
        queryKey: [...clientNoteKeys.lists(), variables.organizationId],
      })
    },
  })
}
