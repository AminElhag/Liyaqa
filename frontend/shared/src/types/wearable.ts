import type { UUID } from "./api";

// Enums
export type WearablePlatformName =
  | "FITBIT"
  | "GARMIN"
  | "GOOGLE_FIT"
  | "APPLE_HEALTH"
  | "WHOOP"
  | "OURA";

export type WearableAuthType = "OAUTH2" | "DEVICE_SDK";
export type SyncSource = "API" | "WEBHOOK" | "SDK";
export type SyncJobType = "FULL_SYNC" | "INCREMENTAL" | "ACTIVITIES" | "WORKOUTS";
export type SyncJobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
export type SyncStatus = "SUCCESS" | "FAILED" | "PARTIAL";

export type WearableActivityType =
  | "RUNNING"
  | "WALKING"
  | "CYCLING"
  | "SWIMMING"
  | "GYM_WORKOUT"
  | "HIIT"
  | "YOGA"
  | "PILATES"
  | "STRENGTH_TRAINING"
  | "CARDIO"
  | "ELLIPTICAL"
  | "ROWING"
  | "STAIR_CLIMBING"
  | "TREADMILL"
  | "CROSS_TRAINING"
  | "HIKING"
  | "DANCE"
  | "MARTIAL_ARTS"
  | "STRETCHING"
  | "MEDITATION"
  | "SLEEP"
  | "OTHER";

// ========== Request Types ==========

export interface CreateConnectionRequest {
  memberId: UUID;
  platformId: UUID;
  externalUserId?: string;
  externalUsername?: string;
}

export interface UpdateConnectionRequest {
  externalUserId?: string;
  externalUsername?: string;
  syncEnabled?: boolean;
}

export interface UpdateConnectionTokensRequest {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface CreateDailyActivityRequest {
  memberId: UUID;
  connectionId: UUID;
  activityDate: string;
  steps?: number;
  distanceMeters?: number;
  floorsClimbed?: number;
  caloriesTotal?: number;
  caloriesActive?: number;
  activeMinutes?: number;
  sedentaryMinutes?: number;
  sleepMinutes?: number;
  sleepQualityScore?: number;
  restingHeartRate?: number;
  hrvAverage?: number;
  stressScore?: number;
  recoveryScore?: number;
  rawData?: Record<string, unknown>;
}

export interface CreateWearableWorkoutRequest {
  memberId: UUID;
  connectionId: UUID;
  externalWorkoutId?: string;
  activityType: string;
  activityName?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  distanceMeters?: number;
  caloriesBurned?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgPaceSecondsPerKm?: number;
  elevationGainMeters?: number;
  steps?: number;
  rawData?: Record<string, unknown>;
}

export interface StartSyncRequest {
  jobType?: SyncJobType;
}

// ========== Response Types ==========

export interface WearablePlatform {
  id: UUID;
  name: WearablePlatformName;
  displayName: string;
  apiBaseUrl: string | null;
  oauthAuthUrl: string | null;
  authType: WearableAuthType;
  logoUrl: string | null;
  isActive: boolean;
  supportsOAuth: boolean;
}

export interface MemberWearableConnection {
  id: UUID;
  memberId: UUID;
  platformId: UUID;
  platformName: WearablePlatformName | null;
  platformDisplayName: string | null;
  platformLogoUrl: string | null;
  externalUserId: string | null;
  externalUsername: string | null;
  hasOAuthTokens: boolean;
  isTokenExpired: boolean;
  syncEnabled: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: SyncStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface WearableDailyActivity {
  id: UUID;
  memberId: UUID;
  connectionId: UUID;
  activityDate: string;
  steps: number | null;
  distanceMeters: number | null;
  distanceKm: number | null;
  floorsClimbed: number | null;
  caloriesTotal: number | null;
  caloriesActive: number | null;
  activeMinutes: number | null;
  activeHours: number | null;
  sedentaryMinutes: number | null;
  sleepMinutes: number | null;
  sleepHours: number | null;
  sleepQualityScore: number | null;
  restingHeartRate: number | null;
  hrvAverage: number | null;
  stressScore: number | null;
  recoveryScore: number | null;
  syncSource: SyncSource;
  createdAt: string;
}

export interface WearableWorkout {
  id: UUID;
  memberId: UUID;
  connectionId: UUID;
  externalWorkoutId: string | null;
  activityType: string;
  activityName: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  durationMinutes: number | null;
  distanceMeters: number | null;
  distanceKm: number | null;
  caloriesBurned: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgPaceSecondsPerKm: number | null;
  avgPaceMinutesPerKm: number | null;
  elevationGainMeters: number | null;
  steps: number | null;
  syncSource: SyncSource;
  createdAt: string;
}

export interface WearableWorkoutStats {
  totalWorkouts: number;
  totalDurationSeconds: number;
  totalDurationMinutes: number;
  totalDurationHours: number;
  totalCalories: number;
}

export interface WearableActivityStats {
  daysTracked: number;
  totalSteps: number;
  averageStepsPerDay: number;
  totalCalories: number;
  totalActiveMinutes: number;
  totalActiveHours: number;
  averageSleepMinutes: number;
  averageSleepHours: number;
  averageRestingHeartRate: number | null;
}

export interface WearableSyncJob {
  id: UUID;
  connectionId: UUID;
  jobType: SyncJobType;
  status: SyncJobStatus;
  startedAt: string | null;
  completedAt: string | null;
  durationSeconds: number | null;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorMessage: string | null;
  createdAt: string;
}

// ========== Labels ==========

export const WEARABLE_PLATFORM_LABELS: Record<WearablePlatformName, string> = {
  FITBIT: "Fitbit",
  GARMIN: "Garmin Connect",
  GOOGLE_FIT: "Google Fit",
  APPLE_HEALTH: "Apple Health",
  WHOOP: "WHOOP",
  OURA: "Oura Ring",
};

export const WEARABLE_PLATFORM_LABELS_AR: Record<WearablePlatformName, string> = {
  FITBIT: "فيتبيت",
  GARMIN: "جارمين كونكت",
  GOOGLE_FIT: "جوجل فيت",
  APPLE_HEALTH: "صحة أبل",
  WHOOP: "ووب",
  OURA: "خاتم أورا",
};

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  SUCCESS: "Success",
  FAILED: "Failed",
  PARTIAL: "Partial",
};

export const SYNC_STATUS_LABELS_AR: Record<SyncStatus, string> = {
  SUCCESS: "ناجح",
  FAILED: "فاشل",
  PARTIAL: "جزئي",
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

export const ACTIVITY_TYPE_LABELS: Record<WearableActivityType, string> = {
  RUNNING: "Running",
  WALKING: "Walking",
  CYCLING: "Cycling",
  SWIMMING: "Swimming",
  GYM_WORKOUT: "Gym Workout",
  HIIT: "HIIT",
  YOGA: "Yoga",
  PILATES: "Pilates",
  STRENGTH_TRAINING: "Strength Training",
  CARDIO: "Cardio",
  ELLIPTICAL: "Elliptical",
  ROWING: "Rowing",
  STAIR_CLIMBING: "Stair Climbing",
  TREADMILL: "Treadmill",
  CROSS_TRAINING: "Cross Training",
  HIKING: "Hiking",
  DANCE: "Dance",
  MARTIAL_ARTS: "Martial Arts",
  STRETCHING: "Stretching",
  MEDITATION: "Meditation",
  SLEEP: "Sleep",
  OTHER: "Other",
};

export const ACTIVITY_TYPE_LABELS_AR: Record<WearableActivityType, string> = {
  RUNNING: "الجري",
  WALKING: "المشي",
  CYCLING: "ركوب الدراجة",
  SWIMMING: "السباحة",
  GYM_WORKOUT: "تمرين صالة",
  HIIT: "تدريب متقطع",
  YOGA: "يوغا",
  PILATES: "بيلاتس",
  STRENGTH_TRAINING: "تدريب القوة",
  CARDIO: "كارديو",
  ELLIPTICAL: "إليبتيكال",
  ROWING: "التجديف",
  STAIR_CLIMBING: "صعود الدرج",
  TREADMILL: "جهاز المشي",
  CROSS_TRAINING: "تدريب شامل",
  HIKING: "المشي لمسافات",
  DANCE: "الرقص",
  MARTIAL_ARTS: "فنون قتالية",
  STRETCHING: "التمدد",
  MEDITATION: "التأمل",
  SLEEP: "النوم",
  OTHER: "أخرى",
};

// Helper to get activity type label (handles dynamic types from API)
export function getActivityTypeLabel(activityType: string, locale: "en" | "ar" = "en"): string {
  const labels = locale === "ar" ? ACTIVITY_TYPE_LABELS_AR : ACTIVITY_TYPE_LABELS;
  return labels[activityType as WearableActivityType] || activityType;
}
