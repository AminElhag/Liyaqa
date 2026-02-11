import { api } from "../client";
import type {
  SettingsByCategoryResponse,
  GlobalSettingResponse,
  UpdateSettingRequest,
  MaintenanceWindowResponse,
  CreateMaintenanceWindowRequest,
} from "../../../types/platform/platform-config";

const BASE_URL = "api/v1/platform/config";

/** GET /settings — all settings grouped by category */
export async function getAllSettingsGrouped(): Promise<SettingsByCategoryResponse[]> {
  return api.get(`${BASE_URL}/settings`).json<SettingsByCategoryResponse[]>();
}

/** PUT /settings/{key} — update a single setting */
export async function updateSetting(
  key: string,
  request: UpdateSettingRequest
): Promise<GlobalSettingResponse> {
  return api
    .put(`${BASE_URL}/settings/${encodeURIComponent(key)}`, { json: request })
    .json<GlobalSettingResponse>();
}

/** GET /maintenance — all maintenance windows */
export async function getAllMaintenanceWindows(): Promise<MaintenanceWindowResponse[]> {
  return api.get(`${BASE_URL}/maintenance`).json<MaintenanceWindowResponse[]>();
}

/** POST /maintenance — create a maintenance window */
export async function createMaintenanceWindow(
  data: CreateMaintenanceWindowRequest
): Promise<MaintenanceWindowResponse> {
  return api
    .post(`${BASE_URL}/maintenance`, { json: data })
    .json<MaintenanceWindowResponse>();
}

/** PUT /maintenance/{id}/cancel — cancel a maintenance window */
export async function cancelMaintenanceWindow(
  id: string
): Promise<MaintenanceWindowResponse> {
  return api
    .put(`${BASE_URL}/maintenance/${id}/cancel`)
    .json<MaintenanceWindowResponse>();
}
