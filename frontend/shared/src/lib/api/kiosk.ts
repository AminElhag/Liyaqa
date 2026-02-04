import { api } from "./client";
import type { UUID, PaginatedResponse } from "../../types/api";
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
} from "../../types/kiosk";

const ENDPOINT = "api/kiosk";

// ========== Device Management (Admin) ==========

export async function getKioskDevices(
  page = 0,
  size = 20
): Promise<PaginatedResponse<KioskDevice>> {
  return api.get(`${ENDPOINT}/devices?page=${page}&size=${size}`).json();
}

export async function getKioskDevice(id: UUID): Promise<KioskDevice> {
  return api.get(`${ENDPOINT}/devices/${id}`).json();
}

export async function getKioskDeviceByCode(code: string): Promise<KioskDevice> {
  return api.get(`${ENDPOINT}/devices/code/${code}`).json();
}

export async function createKioskDevice(data: CreateKioskDeviceRequest): Promise<KioskDevice> {
  return api.post(`${ENDPOINT}/devices`, { json: data }).json();
}

export async function updateKioskDevice(id: UUID, data: UpdateKioskDeviceRequest): Promise<KioskDevice> {
  return api.put(`${ENDPOINT}/devices/${id}`, { json: data }).json();
}

export async function deleteKioskDevice(id: UUID): Promise<void> {
  await api.delete(`${ENDPOINT}/devices/${id}`);
}

export async function sendKioskHeartbeat(id: UUID): Promise<void> {
  await api.post(`${ENDPOINT}/devices/${id}/heartbeat`);
}

// ========== Session Management (Kiosk App) ==========

export async function startSession(data: StartSessionRequest): Promise<KioskSession> {
  return api.post(`${ENDPOINT}/sessions`, { json: data }).json();
}

export async function getSession(id: UUID): Promise<KioskSession> {
  return api.get(`${ENDPOINT}/sessions/${id}`).json();
}

export async function identifyMember(sessionId: UUID, data: IdentifyMemberRequest): Promise<KioskSession> {
  return api.post(`${ENDPOINT}/sessions/${sessionId}/identify`, { json: data }).json();
}

export async function endSession(sessionId: UUID, data: EndSessionRequest): Promise<KioskSession> {
  return api.post(`${ENDPOINT}/sessions/${sessionId}/end`, { json: data }).json();
}

export async function performCheckIn(sessionId: UUID, data: CheckInRequest): Promise<KioskTransaction> {
  return api.post(`${ENDPOINT}/sessions/${sessionId}/check-in`, { json: data }).json();
}

// ========== Transaction Management ==========

export async function createTransaction(sessionId: UUID, data: CreateTransactionRequest): Promise<KioskTransaction> {
  return api.post(`${ENDPOINT}/sessions/${sessionId}/transactions`, { json: data }).json();
}

export async function getSessionTransactions(sessionId: UUID): Promise<KioskTransaction[]> {
  return api.get(`${ENDPOINT}/sessions/${sessionId}/transactions`).json();
}

export async function completeTransaction(id: UUID, data: CompleteTransactionRequest): Promise<KioskTransaction> {
  return api.post(`${ENDPOINT}/transactions/${id}/complete`, { json: data }).json();
}

export async function failTransaction(id: UUID, data: FailTransactionRequest): Promise<KioskTransaction> {
  return api.post(`${ENDPOINT}/transactions/${id}/fail`, { json: data }).json();
}

export async function markReceiptPrinted(id: UUID): Promise<KioskTransaction> {
  return api.post(`${ENDPOINT}/transactions/${id}/receipt/print`).json();
}

// ========== Signature Management ==========

export async function createSignature(sessionId: UUID, data: CreateSignatureRequest): Promise<KioskSignature> {
  return api.post(`${ENDPOINT}/sessions/${sessionId}/signatures`, { json: data }).json();
}

export async function getSessionSignatures(sessionId: UUID): Promise<KioskSignature[]> {
  return api.get(`${ENDPOINT}/sessions/${sessionId}/signatures`).json();
}

// ========== Admin Endpoints ==========

export async function getAdminSessions(
  page = 0,
  size = 50
): Promise<PaginatedResponse<KioskSession>> {
  return api.get(`${ENDPOINT}/admin/sessions?page=${page}&size=${size}`).json();
}

export async function getAdminTransactions(
  page = 0,
  size = 50
): Promise<PaginatedResponse<KioskTransaction>> {
  return api.get(`${ENDPOINT}/admin/transactions?page=${page}&size=${size}`).json();
}
