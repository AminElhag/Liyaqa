"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getClientNotes,
  getClientNote,
  createClientNote,
  updateClientNote,
  deleteClientNote,
  toggleClientNotePin,
} from "../lib/api/platform/client-notes";
import type { PageResponse, UUID } from "../types/api";
import type {
  ClientNote,
  CreateClientNoteRequest,
  UpdateClientNoteRequest,
  ClientNoteQueryParams,
} from "../types/platform/client-note";

// Query keys
export const clientNoteKeys = {
  all: ["platform", "client-notes"] as const,
  lists: () => [...clientNoteKeys.all, "list"] as const,
  list: (organizationId: UUID, params: ClientNoteQueryParams) =>
    [...clientNoteKeys.lists(), organizationId, params] as const,
  details: () => [...clientNoteKeys.all, "detail"] as const,
  detail: (organizationId: UUID, noteId: UUID) =>
    [...clientNoteKeys.details(), organizationId, noteId] as const,
};

/**
 * Hook to fetch paginated client notes
 */
export function useClientNotes(
  organizationId: UUID,
  params: ClientNoteQueryParams = {},
  options?: Omit<UseQueryOptions<PageResponse<ClientNote>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: clientNoteKeys.list(organizationId, params),
    queryFn: () => getClientNotes(organizationId, params),
    enabled: !!organizationId,
    ...options,
  });
}

/**
 * Hook to fetch a single client note by ID
 */
export function useClientNote(
  organizationId: UUID,
  noteId: UUID,
  options?: Omit<UseQueryOptions<ClientNote>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: clientNoteKeys.detail(organizationId, noteId),
    queryFn: () => getClientNote(organizationId, noteId),
    enabled: !!organizationId && !!noteId,
    ...options,
  });
}

/**
 * Hook to create a new client note
 */
export function useCreateClientNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      data,
    }: {
      organizationId: UUID;
      data: CreateClientNoteRequest;
    }) => createClientNote(organizationId, data),
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({
        queryKey: clientNoteKeys.lists(),
      });
      // Also invalidate client health as note count affects it
      queryClient.invalidateQueries({
        queryKey: ["platform", "clients", "health", organizationId],
      });
    },
  });
}

/**
 * Hook to update a client note
 */
export function useUpdateClientNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      noteId,
      data,
    }: {
      organizationId: UUID;
      noteId: UUID;
      data: UpdateClientNoteRequest;
    }) => updateClientNote(organizationId, noteId, data),
    onSuccess: (updatedNote, { organizationId }) => {
      queryClient.setQueryData(
        clientNoteKeys.detail(organizationId, updatedNote.id),
        updatedNote
      );
      queryClient.invalidateQueries({
        queryKey: clientNoteKeys.lists(),
      });
    },
  });
}

/**
 * Hook to delete a client note
 */
export function useDeleteClientNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      noteId,
    }: {
      organizationId: UUID;
      noteId: UUID;
    }) => deleteClientNote(organizationId, noteId),
    onSuccess: (_, { organizationId, noteId }) => {
      queryClient.removeQueries({
        queryKey: clientNoteKeys.detail(organizationId, noteId),
      });
      queryClient.invalidateQueries({
        queryKey: clientNoteKeys.lists(),
      });
      // Also invalidate client health as note count affects it
      queryClient.invalidateQueries({
        queryKey: ["platform", "clients", "health", organizationId],
      });
    },
  });
}

/**
 * Hook to toggle pin status of a client note
 */
export function useToggleClientNotePin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      noteId,
    }: {
      organizationId: UUID;
      noteId: UUID;
    }) => toggleClientNotePin(organizationId, noteId),
    onSuccess: (updatedNote, { organizationId }) => {
      queryClient.setQueryData(
        clientNoteKeys.detail(organizationId, updatedNote.id),
        updatedNote
      );
      queryClient.invalidateQueries({
        queryKey: clientNoteKeys.lists(),
      });
    },
  });
}
