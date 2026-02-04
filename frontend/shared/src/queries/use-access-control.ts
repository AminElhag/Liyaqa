"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { UUID, PaginatedResponse } from "../types/api";
import {
  getZones,
  getZone,
  getZonesByLocation,
  createZone,
  updateZone,
  deleteZone,
  getDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
  getTimeRules,
  getTimeRule,
  createTimeRule,
  updateTimeRule,
  deleteTimeRule,
  getCards,
  getCard,
  getCardsByMember,
  issueCard,
  updateCard,
  suspendCard,
  reactivateCard,
  reportCardLost,
  deleteCard,
  getBiometrics,
  getBiometric,
  getBiometricsByMember,
  enrollBiometric,
  suspendBiometric,
  reactivateBiometric,
  deleteBiometric,
  getAccessLogs,
  getAccessLogsByMember,
  getAllOccupancies,
  getZoneOccupancy,
} from "../lib/api/access-control";
import type {
  AccessZone,
  AccessDevice,
  AccessTimeRule,
  MemberAccessCard,
  BiometricEnrollment,
  AccessLog,
  ZoneOccupancy,
  CreateZoneRequest,
  UpdateZoneRequest,
  CreateDeviceRequest,
  UpdateDeviceRequest,
  CreateTimeRuleRequest,
  UpdateTimeRuleRequest,
  IssueCardRequest,
  UpdateCardRequest,
  EnrollBiometricRequest,
} from "../types/access-control";

// Query keys
export const accessControlKeys = {
  all: ["access-control"] as const,
  zones: () => [...accessControlKeys.all, "zones"] as const,
  zonesList: (page: number, size: number) =>
    [...accessControlKeys.zones(), "list", page, size] as const,
  zoneDetail: (id: UUID) => [...accessControlKeys.zones(), id] as const,
  zonesByLocation: (locationId: UUID) =>
    [...accessControlKeys.zones(), "location", locationId] as const,
  devices: () => [...accessControlKeys.all, "devices"] as const,
  devicesList: (page: number, size: number) =>
    [...accessControlKeys.devices(), "list", page, size] as const,
  deviceDetail: (id: UUID) => [...accessControlKeys.devices(), id] as const,
  rules: () => [...accessControlKeys.all, "rules"] as const,
  rulesList: (page: number, size: number) =>
    [...accessControlKeys.rules(), "list", page, size] as const,
  ruleDetail: (id: UUID) => [...accessControlKeys.rules(), id] as const,
  cards: () => [...accessControlKeys.all, "cards"] as const,
  cardsList: (page: number, size: number) =>
    [...accessControlKeys.cards(), "list", page, size] as const,
  cardDetail: (id: UUID) => [...accessControlKeys.cards(), id] as const,
  cardsByMember: (memberId: UUID) =>
    [...accessControlKeys.cards(), "member", memberId] as const,
  biometrics: () => [...accessControlKeys.all, "biometrics"] as const,
  biometricsList: (page: number, size: number) =>
    [...accessControlKeys.biometrics(), "list", page, size] as const,
  biometricDetail: (id: UUID) => [...accessControlKeys.biometrics(), id] as const,
  biometricsByMember: (memberId: UUID) =>
    [...accessControlKeys.biometrics(), "member", memberId] as const,
  logs: () => [...accessControlKeys.all, "logs"] as const,
  logsList: (page: number, size: number) =>
    [...accessControlKeys.logs(), "list", page, size] as const,
  logsByMember: (memberId: UUID, page: number, size: number) =>
    [...accessControlKeys.logs(), "member", memberId, page, size] as const,
  occupancy: () => [...accessControlKeys.all, "occupancy"] as const,
  zoneOccupancy: (zoneId: UUID) =>
    [...accessControlKeys.occupancy(), zoneId] as const,
};

// ========== Zones ==========

export function useZones(
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<AccessZone>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.zonesList(page, size),
    queryFn: () => getZones(page, size),
    ...options,
  });
}

export function useZone(
  id: UUID,
  options?: Omit<UseQueryOptions<AccessZone>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.zoneDetail(id),
    queryFn: () => getZone(id),
    enabled: !!id,
    ...options,
  });
}

export function useZonesByLocation(
  locationId: UUID,
  options?: Omit<UseQueryOptions<AccessZone[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.zonesByLocation(locationId),
    queryFn: () => getZonesByLocation(locationId),
    enabled: !!locationId,
    ...options,
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateZoneRequest) => createZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accessControlKeys.zones() });
    },
  });
}

export function useUpdateZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateZoneRequest }) =>
      updateZone(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(accessControlKeys.zoneDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: accessControlKeys.zones() });
    },
  });
}

export function useDeleteZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteZone(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: accessControlKeys.zoneDetail(id) });
      queryClient.invalidateQueries({ queryKey: accessControlKeys.zones() });
    },
  });
}

// ========== Devices ==========

export function useDevices(
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<AccessDevice>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.devicesList(page, size),
    queryFn: () => getDevices(page, size),
    ...options,
  });
}

export function useDevice(
  id: UUID,
  options?: Omit<UseQueryOptions<AccessDevice>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.deviceDetail(id),
    queryFn: () => getDevice(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDeviceRequest) => createDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accessControlKeys.devices() });
    },
  });
}

export function useUpdateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateDeviceRequest }) =>
      updateDevice(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(accessControlKeys.deviceDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: accessControlKeys.devices() });
    },
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteDevice(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: accessControlKeys.deviceDetail(id) });
      queryClient.invalidateQueries({ queryKey: accessControlKeys.devices() });
    },
  });
}

// ========== Time Rules ==========

export function useTimeRules(
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<AccessTimeRule>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.rulesList(page, size),
    queryFn: () => getTimeRules(page, size),
    ...options,
  });
}

export function useTimeRule(
  id: UUID,
  options?: Omit<UseQueryOptions<AccessTimeRule>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.ruleDetail(id),
    queryFn: () => getTimeRule(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateTimeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimeRuleRequest) => createTimeRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accessControlKeys.rules() });
    },
  });
}

export function useUpdateTimeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateTimeRuleRequest }) =>
      updateTimeRule(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(accessControlKeys.ruleDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: accessControlKeys.rules() });
    },
  });
}

export function useDeleteTimeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteTimeRule(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: accessControlKeys.ruleDetail(id) });
      queryClient.invalidateQueries({ queryKey: accessControlKeys.rules() });
    },
  });
}

// ========== Cards ==========

export function useCards(
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<MemberAccessCard>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.cardsList(page, size),
    queryFn: () => getCards(page, size),
    ...options,
  });
}

export function useCard(
  id: UUID,
  options?: Omit<UseQueryOptions<MemberAccessCard>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.cardDetail(id),
    queryFn: () => getCard(id),
    enabled: !!id,
    ...options,
  });
}

export function useCardsByMember(
  memberId: UUID,
  options?: Omit<UseQueryOptions<MemberAccessCard[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.cardsByMember(memberId),
    queryFn: () => getCardsByMember(memberId),
    enabled: !!memberId,
    ...options,
  });
}

export function useIssueCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: IssueCardRequest) => issueCard(data),
    onSuccess: (card) => {
      queryClient.invalidateQueries({ queryKey: accessControlKeys.cards() });
      queryClient.invalidateQueries({
        queryKey: accessControlKeys.cardsByMember(card.memberId),
      });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: UUID; data: UpdateCardRequest }) =>
      updateCard(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(accessControlKeys.cardDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: accessControlKeys.cards() });
    },
  });
}

export function useSuspendCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => suspendCard(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(accessControlKeys.cardDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: accessControlKeys.cards() });
    },
  });
}

export function useReactivateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => reactivateCard(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(accessControlKeys.cardDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: accessControlKeys.cards() });
    },
  });
}

export function useReportCardLost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => reportCardLost(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(accessControlKeys.cardDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: accessControlKeys.cards() });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteCard(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: accessControlKeys.cardDetail(id) });
      queryClient.invalidateQueries({ queryKey: accessControlKeys.cards() });
    },
  });
}

// ========== Biometrics ==========

export function useBiometrics(
  page = 0,
  size = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<BiometricEnrollment>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.biometricsList(page, size),
    queryFn: () => getBiometrics(page, size),
    ...options,
  });
}

export function useBiometric(
  id: UUID,
  options?: Omit<UseQueryOptions<BiometricEnrollment>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.biometricDetail(id),
    queryFn: () => getBiometric(id),
    enabled: !!id,
    ...options,
  });
}

export function useBiometricsByMember(
  memberId: UUID,
  options?: Omit<UseQueryOptions<BiometricEnrollment[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.biometricsByMember(memberId),
    queryFn: () => getBiometricsByMember(memberId),
    enabled: !!memberId,
    ...options,
  });
}

export function useEnrollBiometric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EnrollBiometricRequest) => enrollBiometric(data),
    onSuccess: (enrollment) => {
      queryClient.invalidateQueries({ queryKey: accessControlKeys.biometrics() });
      queryClient.invalidateQueries({
        queryKey: accessControlKeys.biometricsByMember(enrollment.memberId),
      });
    },
  });
}

export function useSuspendBiometric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => suspendBiometric(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(accessControlKeys.biometricDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: accessControlKeys.biometrics() });
    },
  });
}

export function useReactivateBiometric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => reactivateBiometric(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(accessControlKeys.biometricDetail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: accessControlKeys.biometrics() });
    },
  });
}

export function useDeleteBiometric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => deleteBiometric(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: accessControlKeys.biometricDetail(id) });
      queryClient.invalidateQueries({ queryKey: accessControlKeys.biometrics() });
    },
  });
}

// ========== Access Logs ==========

export function useAccessLogs(
  page = 0,
  size = 50,
  options?: Omit<UseQueryOptions<PaginatedResponse<AccessLog>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.logsList(page, size),
    queryFn: () => getAccessLogs(page, size),
    ...options,
  });
}

export function useAccessLogsByMember(
  memberId: UUID,
  page = 0,
  size = 50,
  options?: Omit<UseQueryOptions<PaginatedResponse<AccessLog>>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.logsByMember(memberId, page, size),
    queryFn: () => getAccessLogsByMember(memberId, page, size),
    enabled: !!memberId,
    ...options,
  });
}

// ========== Occupancy ==========

export function useAllOccupancies(
  options?: Omit<UseQueryOptions<ZoneOccupancy[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.occupancy(),
    queryFn: () => getAllOccupancies(),
    refetchInterval: 30000, // Refresh every 30 seconds
    ...options,
  });
}

export function useZoneOccupancy(
  zoneId: UUID,
  options?: Omit<UseQueryOptions<ZoneOccupancy>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: accessControlKeys.zoneOccupancy(zoneId),
    queryFn: () => getZoneOccupancy(zoneId),
    enabled: !!zoneId,
    refetchInterval: 30000,
    ...options,
  });
}
