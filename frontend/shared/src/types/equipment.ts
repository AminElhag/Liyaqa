import type { UUID } from "./api";

// Enums
export type EquipmentType =
  | "TREADMILL"
  | "ELLIPTICAL"
  | "BIKE"
  | "SPIN_BIKE"
  | "ROWER"
  | "STAIR_CLIMBER"
  | "CROSS_TRAINER"
  | "STRENGTH_MACHINE"
  | "FREE_WEIGHTS"
  | "CABLE_MACHINE"
  | "SMITH_MACHINE"
  | "OTHER";

export type EquipmentStatus = "ACTIVE" | "MAINTENANCE" | "OFFLINE" | "RETIRED";
export type AuthType = "API_KEY" | "OAUTH2" | "BASIC";
export type WorkoutType =
  | "CARDIO"
  | "STRENGTH"
  | "FLEXIBILITY"
  | "HIIT"
  | "ENDURANCE"
  | "RECOVERY"
  | "MIXED"
  | "OTHER";

export type SyncSource = "API" | "WEBHOOK" | "MANUAL";
export type SyncJobType = "FULL_SYNC" | "INCREMENTAL" | "MEMBER_SYNC";
export type SyncJobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

// ========== Request Types ==========

export interface CreateProviderConfigRequest {
  providerId: UUID;
  apiKey?: string;
  apiSecret?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  webhookSecret?: string;
  customConfig?: Record<string, unknown>;
  syncIntervalMinutes?: number;
}

export interface UpdateProviderConfigRequest {
  apiKey?: string;
  apiSecret?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  webhookSecret?: string;
  customConfig?: Record<string, unknown>;
  isActive?: boolean;
  syncEnabled?: boolean;
  syncIntervalMinutes?: number;
}

export interface CreateEquipmentUnitRequest {
  locationId: UUID;
  providerId: UUID;
  externalId?: string;
  equipmentType: EquipmentType;
  name: string;
  nameAr?: string;
  model?: string;
  serialNumber?: string;
  manufacturer?: string;
  zone?: string;
  floorNumber?: number;
  positionX?: number;
  positionY?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateEquipmentUnitRequest {
  name?: string;
  nameAr?: string;
  equipmentType?: EquipmentType;
  model?: string;
  serialNumber?: string;
  status?: EquipmentStatus;
  zone?: string;
  floorNumber?: number;
  positionX?: number;
  positionY?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateMemberProfileRequest {
  memberId: UUID;
  providerId: UUID;
  externalMemberId?: string;
  externalUsername?: string;
}

export interface UpdateMemberProfileRequest {
  externalMemberId?: string;
  externalUsername?: string;
  syncEnabled?: boolean;
}

export interface CreateWorkoutRequest {
  memberId: UUID;
  providerId: UUID;
  equipmentUnitId?: UUID;
  externalWorkoutId?: string;
  workoutType: WorkoutType;
  equipmentType?: EquipmentType;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  distanceMeters?: number;
  steps?: number;
  floorsClimbed?: number;
  caloriesTotal?: number;
  caloriesActive?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  heartRateZones?: Record<string, number>;
  avgSpeedKmh?: number;
  maxSpeedKmh?: number;
  avgPowerWatts?: number;
  maxPowerWatts?: number;
  avgCadence?: number;
  totalReps?: number;
  totalSets?: number;
  totalWeightKg?: number;
  exercises?: Array<Record<string, unknown>>;
  rawData?: Record<string, unknown>;
}

export interface StartSyncRequest {
  jobType?: SyncJobType;
}

// ========== Response Types ==========

export interface EquipmentProvider {
  id: UUID;
  name: string;
  displayName: string;
  apiBaseUrl: string | null;
  authType: AuthType;
  documentationUrl: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface EquipmentProviderConfig {
  id: UUID;
  providerId: UUID;
  providerName: string | null;
  hasApiKey: boolean;
  hasOAuthClient: boolean;
  hasOAuthTokens: boolean;
  isTokenExpired: boolean;
  isActive: boolean;
  syncEnabled: boolean;
  syncIntervalMinutes: number;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentUnit {
  id: UUID;
  locationId: UUID;
  providerId: UUID;
  providerName: string | null;
  externalId: string | null;
  equipmentType: EquipmentType;
  name: string;
  nameAr: string | null;
  model: string | null;
  serialNumber: string | null;
  manufacturer: string | null;
  isConnected: boolean;
  lastConnectedAt: string | null;
  status: EquipmentStatus;
  zone: string | null;
  floorNumber: number | null;
  positionX: number | null;
  positionY: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberEquipmentProfile {
  id: UUID;
  memberId: UUID;
  providerId: UUID;
  providerName: string | null;
  externalMemberId: string | null;
  externalUsername: string | null;
  hasOAuthTokens: boolean;
  isTokenExpired: boolean;
  syncEnabled: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentWorkout {
  id: UUID;
  memberId: UUID;
  equipmentUnitId: UUID | null;
  providerId: UUID;
  externalWorkoutId: string | null;
  workoutType: WorkoutType;
  equipmentType: EquipmentType | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  durationMinutes: number | null;
  distanceMeters: number | null;
  distanceKm: number | null;
  steps: number | null;
  floorsClimbed: number | null;
  caloriesTotal: number | null;
  caloriesActive: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgSpeedKmh: number | null;
  maxSpeedKmh: number | null;
  avgPowerWatts: number | null;
  maxPowerWatts: number | null;
  avgCadence: number | null;
  totalReps: number | null;
  totalSets: number | null;
  totalWeightKg: number | null;
  syncSource: SyncSource;
  createdAt: string;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalDurationSeconds: number;
  totalDurationMinutes: number;
  totalDurationHours: number;
  totalCalories: number;
}

export interface EquipmentSyncJob {
  id: UUID;
  providerConfigId: UUID;
  jobType: SyncJobType;
  status: SyncJobStatus;
  startedAt: string | null;
  completedAt: string | null;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorMessage: string | null;
  createdAt: string;
}

// ========== Labels ==========

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  TREADMILL: "Treadmill",
  ELLIPTICAL: "Elliptical",
  BIKE: "Stationary Bike",
  SPIN_BIKE: "Spin Bike",
  ROWER: "Rowing Machine",
  STAIR_CLIMBER: "Stair Climber",
  CROSS_TRAINER: "Cross Trainer",
  STRENGTH_MACHINE: "Strength Machine",
  FREE_WEIGHTS: "Free Weights",
  CABLE_MACHINE: "Cable Machine",
  SMITH_MACHINE: "Smith Machine",
  OTHER: "Other",
};

export const EQUIPMENT_TYPE_LABELS_AR: Record<EquipmentType, string> = {
  TREADMILL: "جهاز المشي",
  ELLIPTICAL: "الإليبتيكال",
  BIKE: "دراجة ثابتة",
  SPIN_BIKE: "دراجة سبين",
  ROWER: "جهاز التجديف",
  STAIR_CLIMBER: "جهاز صعود الدرج",
  CROSS_TRAINER: "الكروس ترينر",
  STRENGTH_MACHINE: "جهاز القوة",
  FREE_WEIGHTS: "أوزان حرة",
  CABLE_MACHINE: "جهاز الكابل",
  SMITH_MACHINE: "سميث ماشين",
  OTHER: "أخرى",
};

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  ACTIVE: "Active",
  MAINTENANCE: "Maintenance",
  OFFLINE: "Offline",
  RETIRED: "Retired",
};

export const EQUIPMENT_STATUS_LABELS_AR: Record<EquipmentStatus, string> = {
  ACTIVE: "نشط",
  MAINTENANCE: "صيانة",
  OFFLINE: "غير متصل",
  RETIRED: "متقاعد",
};

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  CARDIO: "Cardio",
  STRENGTH: "Strength",
  FLEXIBILITY: "Flexibility",
  HIIT: "HIIT",
  ENDURANCE: "Endurance",
  RECOVERY: "Recovery",
  MIXED: "Mixed",
  OTHER: "Other",
};

export const WORKOUT_TYPE_LABELS_AR: Record<WorkoutType, string> = {
  CARDIO: "كارديو",
  STRENGTH: "قوة",
  FLEXIBILITY: "مرونة",
  HIIT: "تدريب متقطع",
  ENDURANCE: "تحمل",
  RECOVERY: "استشفاء",
  MIXED: "مختلط",
  OTHER: "أخرى",
};

export const SYNC_JOB_STATUS_LABELS: Record<SyncJobStatus, string> = {
  PENDING: "Pending",
  RUNNING: "Running",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

export const SYNC_JOB_STATUS_LABELS_AR: Record<SyncJobStatus, string> = {
  PENDING: "في الانتظار",
  RUNNING: "قيد التشغيل",
  COMPLETED: "مكتمل",
  FAILED: "فاشل",
};
