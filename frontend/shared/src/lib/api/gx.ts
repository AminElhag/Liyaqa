import { api } from "./client";
import type { PaginatedResponse } from "../../types/api";
import type {
  GxSettings,
  UpdateGxSettingsRequest,
  RoomLayout,
  CreateRoomLayoutRequest,
  UpdateRoomLayoutRequest,
} from "../../types/scheduling";

// ==================== GX SETTINGS ====================

export async function getGxSettings(): Promise<GxSettings> {
  return api.get("api/gx/settings").json<GxSettings>();
}

export async function updateGxSettings(
  data: UpdateGxSettingsRequest
): Promise<GxSettings> {
  return api.put("api/gx/settings", { json: data }).json<GxSettings>();
}

// ==================== ROOM LAYOUTS ====================

export async function getRoomLayouts(
  params: { page?: number; size?: number } = {}
): Promise<PaginatedResponse<RoomLayout>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));

  const queryString = searchParams.toString();
  const url = queryString
    ? `api/gx/room-layouts?${queryString}`
    : "api/gx/room-layouts";

  return api.get(url).json<PaginatedResponse<RoomLayout>>();
}

export async function getActiveRoomLayouts(): Promise<RoomLayout[]> {
  return api.get("api/gx/room-layouts/active").json<RoomLayout[]>();
}

export async function getRoomLayout(id: string): Promise<RoomLayout> {
  return api.get(`api/gx/room-layouts/${id}`).json<RoomLayout>();
}

export async function createRoomLayout(
  data: CreateRoomLayoutRequest
): Promise<RoomLayout> {
  return api.post("api/gx/room-layouts", { json: data }).json<RoomLayout>();
}

export async function updateRoomLayout(
  id: string,
  data: UpdateRoomLayoutRequest
): Promise<RoomLayout> {
  return api
    .put(`api/gx/room-layouts/${id}`, { json: data })
    .json<RoomLayout>();
}

export async function activateRoomLayout(id: string): Promise<RoomLayout> {
  return api
    .post(`api/gx/room-layouts/${id}/activate`)
    .json<RoomLayout>();
}

export async function deactivateRoomLayout(id: string): Promise<RoomLayout> {
  return api
    .post(`api/gx/room-layouts/${id}/deactivate`)
    .json<RoomLayout>();
}

export async function deleteRoomLayout(id: string): Promise<void> {
  await api.delete(`api/gx/room-layouts/${id}`);
}
