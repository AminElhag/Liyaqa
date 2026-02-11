// Matches backend SettingCategory enum
export type SettingCategory =
  | "GENERAL"
  | "BILLING"
  | "SECURITY"
  | "LOCALIZATION"
  | "NOTIFICATIONS"
  | "SYSTEM"
  | "COMPLIANCE";

// Matches backend SettingValueType enum
export type SettingValueType = "STRING" | "NUMBER" | "BOOLEAN" | "JSON";

// Matches backend GlobalSettingResponse
export interface GlobalSettingResponse {
  id: string;
  key: string;
  value: string;
  valueType: SettingValueType;
  category: SettingCategory;
  description: string | null;
  descriptionAr: string | null;
  isEditable: boolean;
  updatedBy: string | null;
  updatedAt: string;
}

// Matches backend SettingsByCategoryResponse
export interface SettingsByCategoryResponse {
  category: SettingCategory;
  settings: GlobalSettingResponse[];
}

// Matches backend UpdateSettingRequest
export interface UpdateSettingRequest {
  value: string;
}

// Matches backend MaintenanceWindowResponse
export interface MaintenanceWindowResponse {
  id: string;
  tenantId: string | null;
  title: string;
  titleAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  startAt: string;
  endAt: string;
  isActive: boolean;
  isCurrentlyActive: boolean;
  createdBy: string;
  createdAt: string;
}

// Matches backend CreateMaintenanceWindowRequest
export interface CreateMaintenanceWindowRequest {
  tenantId?: string | null;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  startAt: string;
  endAt: string;
}
