"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { UUID, PaginatedResponse } from "../types/api";
import {
  getKioskDevices,
  getKioskDevice,
  getKioskDeviceByCode,
  createKioskDevice,
  updateKioskDevice,
  deleteKioskDevice,
  sendKioskHeartbeat,
  startSession,
  getSession,
  identifyMember,
  endSession,
  performCheckIn,
  createTransaction,
  getSessionTransactions,
  completeTransaction,
  failTransaction,
  markReceiptPrinted,
  createSignature,
  getSessionSignatures,
  getAdminSessions,
  getAdminTransactions,
} from "../lib/api/kiosk";
import type {
  KioskDevice,
  KioskSession,
  KioskTransaction,
  KioskSignature,
  CreateKioskDeviceRequest,
  UpdateKioskDeviceRequest,
  StartSessionRequest,
  IdentifyMemberRequest,
  EndSessionRequest,
  CreateTransactionRequest,
  CompleteTransactionRequest,
  FailTransactionRequest,
  CreateSignatureRequest,
  CheckInRequest,
} from "../types/kiosk";

// Query keys
export const kioskKeys = {
  all: ["kiosk"] as const,
  devices: () => [...kioskKeys.all, "devices"] as const,
  devicesList: (page: number, size: number) =>
    [...kioskKeys.devices(), "list", page, size] as const,
  deviceDetail: (id: UUID) => [...kioskKeys.devices(), id] as const,
  deviceByCode: (code: string) => [...kioskKeys.devices(), "code", code] as const,
  sessions: () => [...kioskKeys.all, "sessions"] as const,
  sessionsList: (page: number, size: number) =>
    [...kioskKeys.sessions(), "list", page, size] as const,
  sessionDetail: (id: UUID) => [...kioskKeys.sessions(), id] as const,
  sessionTransactions: (sessionId: UUID) =>
    [...kioskKeys.sessions(), sessionId, "transactions"] as const,
  sessionSignatures: (sessionId: UUID) =>
    [...kioskKeys.sessions(), sessionId, "signatures"] as const,
  transactions: () => [...kioskKeys.all, "transactions"] as const,
  transactionsList: (page: number, size: number) =>
    [...kioskKeys.transactions(), "list", page, size] as const,
};

// ========== Devices ==========

export function useKioskDevices(
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<KioskDevice>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: kioskKeys.devicesList(page, size),
    queryFn: () => getKioskDevices(page, size),
    ...options,
  });
}

export function useKioskDevice(
  id: UUID,
  options?: Omit<UseQueryOptions<KioskDevice>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: kioskKeys.deviceDetail(id),
    queryFn: () => getKioskDevice(id),
    enabled: !!id,
    ...options,
  });
}

export function useKioskDeviceByCode(
  code: string,
  options?: Omit<UseQueryOptions<KioskDevice>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: kioskKeys.deviceByCode(code),
    queryFn: () => getKioskDeviceByCode(code),
    enabled: !!code,
    ...options,
  });
}

export function useCreateKioskDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateKioskDeviceRequest) => createKioskDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kioskKeys.devices() });
    },
  });
}

export function useUpdateKioskDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateKioskDeviceRequest }) =>
      updateKioskDevice(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(kioskKeys.deviceDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: kioskKeys.devices() });
    },
  });
}

export function useDeleteKioskDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteKioskDevice(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: kioskKeys.deviceDetail(id) });
      queryClient.invalidateQueries({ queryKey: kioskKeys.devices() });
    },
  });
}

export function useSendKioskHeartbeat() {
  return useMutation({
    mutationFn: (id: UUID) => sendKioskHeartbeat(id),
  });
}

// ========== Sessions ==========

export function useKioskSession(
  id: UUID,
  options?: Omit<UseQueryOptions<KioskSession>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: kioskKeys.sessionDetail(id),
    queryFn: () => getSession(id),
    enabled: !!id,
    ...options,
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StartSessionRequest) => startSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kioskKeys.sessions() });
    },
  });
}

export function useIdentifyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: UUID; data: IdentifyMemberRequest }) =>
      identifyMember(sessionId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(kioskKeys.sessionDetail(updated.id), updated);
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: UUID; data: EndSessionRequest }) =>
      endSession(sessionId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(kioskKeys.sessionDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: kioskKeys.sessions() });
    },
  });
}

export function usePerformCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: UUID; data: CheckInRequest }) =>
      performCheckIn(sessionId, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: kioskKeys.sessionTransactions(sessionId) });
    },
  });
}

// ========== Transactions ==========

export function useSessionTransactions(
  sessionId: UUID,
  options?: Omit<UseQueryOptions<KioskTransaction[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: kioskKeys.sessionTransactions(sessionId),
    queryFn: () => getSessionTransactions(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: UUID; data: CreateTransactionRequest }) =>
      createTransaction(sessionId, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: kioskKeys.sessionTransactions(sessionId) });
    },
  });
}

export function useCompleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: CompleteTransactionRequest }) =>
      completeTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kioskKeys.transactions() });
    },
  });
}

export function useFailTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: FailTransactionRequest }) =>
      failTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kioskKeys.transactions() });
    },
  });
}

export function useMarkReceiptPrinted() {
  return useMutation({
    mutationFn: (id: UUID) => markReceiptPrinted(id),
  });
}

// ========== Signatures ==========

export function useSessionSignatures(
  sessionId: UUID,
  options?: Omit<UseQueryOptions<KioskSignature[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: kioskKeys.sessionSignatures(sessionId),
    queryFn: () => getSessionSignatures(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

export function useCreateSignature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: UUID; data: CreateSignatureRequest }) =>
      createSignature(sessionId, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: kioskKeys.sessionSignatures(sessionId) });
    },
  });
}

// ========== Admin ==========

export function useAdminSessions(
  page = 0,
  size = 50,
  options?: Omit<UseQueryOptions<PaginatedResponse<KioskSession>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: kioskKeys.sessionsList(page, size),
    queryFn: () => getAdminSessions(page, size),
    ...options,
  });
}

export function useAdminTransactions(
  page = 0,
  size = 50,
  options?: Omit<UseQueryOptions<PaginatedResponse<KioskTransaction>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: kioskKeys.transactionsList(page, size),
    queryFn: () => getAdminTransactions(page, size),
    ...options,
  });
}
