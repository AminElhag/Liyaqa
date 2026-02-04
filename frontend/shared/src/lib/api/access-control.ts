import { api } from "./client";
import type { UUID, PaginatedResponse } from "../../types/api";
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
  ProcessAccessRequest,
} from "../../types/access-control";

const ENDPOINT = "api/access-control";

// ========== Zones ==========

export async function getZones(
  page = 0,
  size = 20
): Promise<PaginatedResponse<AccessZone>> {
  return api.get(`${ENDPOINT}/zones?page=${page}&size=${size}`).json();
}

export async function getZone(id: UUID): Promise<AccessZone> {
  return api.get(`${ENDPOINT}/zones/${id}`).json();
}

export async function getZonesByLocation(locationId: UUID): Promise<AccessZone[]> {
  return api.get(`${ENDPOINT}/zones/location/${locationId}`).json();
}

export async function createZone(data: CreateZoneRequest): Promise<AccessZone> {
  return api.post(`${ENDPOINT}/zones`, { json: data }).json();
}

export async function updateZone(id: UUID, data: UpdateZoneRequest): Promise<AccessZone> {
  return api.put(`${ENDPOINT}/zones/${id}`, { json: data }).json();
}

export async function deleteZone(id: UUID): Promise<void> {
  await api.delete(`${ENDPOINT}/zones/${id}`);
}

// ========== Devices ==========

export async function getDevices(
  page = 0,
  size = 20
): Promise<PaginatedResponse<AccessDevice>> {
  return api.get(`${ENDPOINT}/devices?page=${page}&size=${size}`).json();
}

export async function getDevice(id: UUID): Promise<AccessDevice> {
  return api.get(`${ENDPOINT}/devices/${id}`).json();
}

export async function createDevice(data: CreateDeviceRequest): Promise<AccessDevice> {
  return api.post(`${ENDPOINT}/devices`, { json: data }).json();
}

export async function updateDevice(id: UUID, data: UpdateDeviceRequest): Promise<AccessDevice> {
  return api.put(`${ENDPOINT}/devices/${id}`, { json: data }).json();
}

export async function deleteDevice(id: UUID): Promise<void> {
  await api.delete(`${ENDPOINT}/devices/${id}`);
}

export async function sendDeviceHeartbeat(id: UUID): Promise<void> {
  await api.post(`${ENDPOINT}/devices/${id}/heartbeat`);
}

// ========== Time Rules ==========

export async function getTimeRules(
  page = 0,
  size = 20
): Promise<PaginatedResponse<AccessTimeRule>> {
  return api.get(`${ENDPOINT}/rules?page=${page}&size=${size}`).json();
}

export async function getTimeRule(id: UUID): Promise<AccessTimeRule> {
  return api.get(`${ENDPOINT}/rules/${id}`).json();
}

export async function createTimeRule(data: CreateTimeRuleRequest): Promise<AccessTimeRule> {
  return api.post(`${ENDPOINT}/rules`, { json: data }).json();
}

export async function updateTimeRule(id: UUID, data: UpdateTimeRuleRequest): Promise<AccessTimeRule> {
  return api.put(`${ENDPOINT}/rules/${id}`, { json: data }).json();
}

export async function deleteTimeRule(id: UUID): Promise<void> {
  await api.delete(`${ENDPOINT}/rules/${id}`);
}

// ========== Cards ==========

export async function getCards(
  page = 0,
  size = 20
): Promise<PaginatedResponse<MemberAccessCard>> {
  return api.get(`${ENDPOINT}/cards?page=${page}&size=${size}`).json();
}

export async function getCard(id: UUID): Promise<MemberAccessCard> {
  return api.get(`${ENDPOINT}/cards/${id}`).json();
}

export async function getCardsByMember(memberId: UUID): Promise<MemberAccessCard[]> {
  return api.get(`${ENDPOINT}/cards/member/${memberId}`).json();
}

export async function issueCard(data: IssueCardRequest): Promise<MemberAccessCard> {
  return api.post(`${ENDPOINT}/cards`, { json: data }).json();
}

export async function updateCard(id: UUID, data: UpdateCardRequest): Promise<MemberAccessCard> {
  return api.put(`${ENDPOINT}/cards/${id}`, { json: data }).json();
}

export async function suspendCard(id: UUID): Promise<MemberAccessCard> {
  return api.post(`${ENDPOINT}/cards/${id}/suspend`).json();
}

export async function reactivateCard(id: UUID): Promise<MemberAccessCard> {
  return api.post(`${ENDPOINT}/cards/${id}/reactivate`).json();
}

export async function reportCardLost(id: UUID): Promise<MemberAccessCard> {
  return api.post(`${ENDPOINT}/cards/${id}/lost`).json();
}

export async function deleteCard(id: UUID): Promise<void> {
  await api.delete(`${ENDPOINT}/cards/${id}`);
}

// ========== Biometrics ==========

export async function getBiometrics(
  page = 0,
  size = 20
): Promise<PaginatedResponse<BiometricEnrollment>> {
  return api.get(`${ENDPOINT}/biometrics?page=${page}&size=${size}`).json();
}

export async function getBiometric(id: UUID): Promise<BiometricEnrollment> {
  return api.get(`${ENDPOINT}/biometrics/${id}`).json();
}

export async function getBiometricsByMember(memberId: UUID): Promise<BiometricEnrollment[]> {
  return api.get(`${ENDPOINT}/biometrics/member/${memberId}`).json();
}

export async function enrollBiometric(data: EnrollBiometricRequest): Promise<BiometricEnrollment> {
  return api.post(`${ENDPOINT}/biometrics`, { json: data }).json();
}

export async function suspendBiometric(id: UUID): Promise<BiometricEnrollment> {
  return api.post(`${ENDPOINT}/biometrics/${id}/suspend`).json();
}

export async function reactivateBiometric(id: UUID): Promise<BiometricEnrollment> {
  return api.post(`${ENDPOINT}/biometrics/${id}/reactivate`).json();
}

export async function deleteBiometric(id: UUID): Promise<void> {
  await api.delete(`${ENDPOINT}/biometrics/${id}`);
}

// ========== Access Processing ==========

export async function processAccess(data: ProcessAccessRequest): Promise<AccessLog> {
  return api.post(`${ENDPOINT}/access`, { json: data }).json();
}

// ========== Access Logs ==========

export async function getAccessLogs(
  page = 0,
  size = 50
): Promise<PaginatedResponse<AccessLog>> {
  return api.get(`${ENDPOINT}/logs?page=${page}&size=${size}`).json();
}

export async function getAccessLogsByMember(
  memberId: UUID,
  page = 0,
  size = 50
): Promise<PaginatedResponse<AccessLog>> {
  return api.get(`${ENDPOINT}/logs/member/${memberId}?page=${page}&size=${size}`).json();
}

// ========== Occupancy ==========

export async function getAllOccupancies(): Promise<ZoneOccupancy[]> {
  return api.get(`${ENDPOINT}/occupancy`).json();
}

export async function getZoneOccupancy(zoneId: UUID): Promise<ZoneOccupancy> {
  return api.get(`${ENDPOINT}/occupancy/zone/${zoneId}`).json();
}
