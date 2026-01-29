import type { UUID } from "./api";

// Enums
export type DeviceType = "TURNSTILE" | "SPEED_GATE" | "BIOMETRIC_TERMINAL" | "RFID_READER" | "QR_SCANNER";
export type DeviceStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "OFFLINE";
export type DeviceDirection = "ENTRY" | "EXIT" | "BIDIRECTIONAL";
export type ZoneType = "GYM_FLOOR" | "LOCKER_ROOM" | "POOL" | "STUDIO" | "SPA" | "RESTRICTED" | "LOBBY" | "CAFE" | "KIDS_AREA";
export type GenderRestriction = "MALE" | "FEMALE";
export type CardType = "RFID" | "NFC" | "MIFARE" | "HID_PROX" | "HID_ICLASS";
export type CardStatus = "ACTIVE" | "SUSPENDED" | "LOST" | "EXPIRED" | "REVOKED";
export type BiometricType = "FINGERPRINT" | "FACE" | "PALM" | "IRIS";
export type FingerPosition = "LEFT_THUMB" | "LEFT_INDEX" | "LEFT_MIDDLE" | "LEFT_RING" | "LEFT_LITTLE" | "RIGHT_THUMB" | "RIGHT_INDEX" | "RIGHT_MIDDLE" | "RIGHT_RING" | "RIGHT_LITTLE";
export type BiometricStatus = "ACTIVE" | "SUSPENDED" | "NEEDS_RE_ENROLLMENT";
export type AccessMethod = "RFID" | "BIOMETRIC" | "QR_CODE" | "PIN" | "MANUAL";
export type AccessDirection = "ENTRY" | "EXIT";
export type AccessResult = "GRANTED" | "DENIED";
export type DenialReason = "EXPIRED_MEMBERSHIP" | "INVALID_CARD" | "TIME_RESTRICTED" | "ZONE_RESTRICTED" | "CAPACITY_FULL" | "UNKNOWN_CREDENTIAL" | "SUSPENDED_CARD" | "BIOMETRIC_MISMATCH" | "MAINTENANCE_MODE";
export type AccessRuleType = "ALLOW" | "DENY";

// ========== Request Types ==========

export interface CreateZoneRequest {
  locationId: UUID;
  name: string;
  nameAr?: string;
  zoneType: ZoneType;
  maxOccupancy?: number;
  genderRestriction?: GenderRestriction;
  requireSpecificPlans?: UUID[];
  isActive?: boolean;
}

export interface UpdateZoneRequest {
  name?: string;
  nameAr?: string;
  maxOccupancy?: number;
  genderRestriction?: GenderRestriction;
  requireSpecificPlans?: UUID[];
  isActive?: boolean;
}

export interface CreateDeviceRequest {
  locationId: UUID;
  deviceType: DeviceType;
  deviceName: string;
  deviceNameAr?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  ipAddress?: string;
  apiEndpoint?: string;
  apiKey?: string;
  zoneId?: UUID;
  direction: DeviceDirection;
  config?: Record<string, unknown>;
}

export interface UpdateDeviceRequest {
  deviceName?: string;
  deviceNameAr?: string;
  ipAddress?: string;
  apiEndpoint?: string;
  apiKey?: string;
  zoneId?: UUID;
  direction?: DeviceDirection;
  status?: DeviceStatus;
  config?: Record<string, unknown>;
}

export interface CreateTimeRuleRequest {
  zoneId?: UUID;
  planId?: UUID;
  memberId?: UUID;
  name: string;
  nameAr?: string;
  dayOfWeek?: number;
  startTime: string; // HH:mm format
  endTime: string;
  accessType: AccessRuleType;
  priority?: number;
  isActive?: boolean;
  validFrom?: string;
  validUntil?: string;
}

export interface UpdateTimeRuleRequest {
  name?: string;
  nameAr?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  accessType?: AccessRuleType;
  priority?: number;
  isActive?: boolean;
  validFrom?: string;
  validUntil?: string;
}

export interface IssueCardRequest {
  memberId: UUID;
  cardType: CardType;
  cardNumber: string;
  facilityCode?: string;
  expiresAt?: string;
  notes?: string;
}

export interface UpdateCardRequest {
  expiresAt?: string;
  notes?: string;
}

export interface EnrollBiometricRequest {
  memberId: UUID;
  biometricType: BiometricType;
  fingerPosition?: FingerPosition;
  templateData: string;
  templateQuality?: number;
  deviceId?: UUID;
}

export interface ProcessAccessRequest {
  deviceId: UUID;
  accessMethod: AccessMethod;
  direction: AccessDirection;
  credential: string;
  confidenceScore?: number;
}

// ========== Response Types ==========

export interface AccessZone {
  id: UUID;
  locationId: UUID;
  name: string;
  nameAr: string | null;
  zoneType: ZoneType;
  maxOccupancy: number | null;
  currentOccupancy: number;
  genderRestriction: GenderRestriction | null;
  requireSpecificPlans: UUID[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccessDevice {
  id: UUID;
  locationId: UUID;
  deviceType: DeviceType;
  deviceName: string;
  deviceNameAr: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  ipAddress: string | null;
  apiEndpoint: string | null;
  zoneId: UUID | null;
  direction: DeviceDirection;
  isOnline: boolean;
  lastHeartbeat: string | null;
  status: DeviceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AccessTimeRule {
  id: UUID;
  zoneId: UUID | null;
  planId: UUID | null;
  memberId: UUID | null;
  name: string;
  nameAr: string | null;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
  accessType: AccessRuleType;
  priority: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberAccessCard {
  id: UUID;
  memberId: UUID;
  cardType: CardType;
  cardNumber: string;
  facilityCode: string | null;
  status: CardStatus;
  issuedAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  notes: string | null;
  isValid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BiometricEnrollment {
  id: UUID;
  memberId: UUID;
  biometricType: BiometricType;
  fingerPosition: FingerPosition | null;
  templateQuality: number | null;
  deviceId: UUID | null;
  enrolledAt: string;
  status: BiometricStatus;
  lastUsedAt: string | null;
  isValid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccessLog {
  id: UUID;
  deviceId: UUID;
  zoneId: UUID | null;
  memberId: UUID | null;
  accessMethod: AccessMethod;
  cardId: UUID | null;
  biometricId: UUID | null;
  direction: AccessDirection;
  result: AccessResult;
  denialReason: DenialReason | null;
  confidenceScore: number | null;
  timestamp: string;
}

export interface ZoneOccupancy {
  id: UUID;
  zoneId: UUID;
  currentCount: number;
  peakCountToday: number;
  peakTimeToday: string | null;
  lastEntryAt: string | null;
  lastExitAt: string | null;
  updatedAt: string;
}

// Labels
export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  TURNSTILE: "Turnstile",
  SPEED_GATE: "Speed Gate",
  BIOMETRIC_TERMINAL: "Biometric Terminal",
  RFID_READER: "RFID Reader",
  QR_SCANNER: "QR Scanner",
};

export const DEVICE_TYPE_LABELS_AR: Record<DeviceType, string> = {
  TURNSTILE: "بوابة دوارة",
  SPEED_GATE: "بوابة سريعة",
  BIOMETRIC_TERMINAL: "جهاز بيومتري",
  RFID_READER: "قارئ RFID",
  QR_SCANNER: "ماسح QR",
};

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  MAINTENANCE: "Maintenance",
  OFFLINE: "Offline",
};

export const DEVICE_STATUS_LABELS_AR: Record<DeviceStatus, string> = {
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
  MAINTENANCE: "صيانة",
  OFFLINE: "غير متصل",
};

export const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  GYM_FLOOR: "Gym Floor",
  LOCKER_ROOM: "Locker Room",
  POOL: "Pool",
  STUDIO: "Studio",
  SPA: "Spa",
  RESTRICTED: "Restricted",
  LOBBY: "Lobby",
  CAFE: "Cafe",
  KIDS_AREA: "Kids Area",
};

export const ZONE_TYPE_LABELS_AR: Record<ZoneType, string> = {
  GYM_FLOOR: "صالة الألعاب",
  LOCKER_ROOM: "غرفة تبديل الملابس",
  POOL: "المسبح",
  STUDIO: "استوديو",
  SPA: "سبا",
  RESTRICTED: "منطقة محظورة",
  LOBBY: "الردهة",
  CAFE: "كافيه",
  KIDS_AREA: "منطقة الأطفال",
};

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  RFID: "RFID",
  NFC: "NFC",
  MIFARE: "Mifare",
  HID_PROX: "HID Prox",
  HID_ICLASS: "HID iCLASS",
};

export const CARD_STATUS_LABELS: Record<CardStatus, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  LOST: "Lost",
  EXPIRED: "Expired",
  REVOKED: "Revoked",
};

export const CARD_STATUS_LABELS_AR: Record<CardStatus, string> = {
  ACTIVE: "نشط",
  SUSPENDED: "موقوف",
  LOST: "مفقود",
  EXPIRED: "منتهي الصلاحية",
  REVOKED: "ملغي",
};

export const BIOMETRIC_TYPE_LABELS: Record<BiometricType, string> = {
  FINGERPRINT: "Fingerprint",
  FACE: "Face Recognition",
  PALM: "Palm Print",
  IRIS: "Iris Scan",
};

export const BIOMETRIC_TYPE_LABELS_AR: Record<BiometricType, string> = {
  FINGERPRINT: "بصمة الإصبع",
  FACE: "التعرف على الوجه",
  PALM: "بصمة الكف",
  IRIS: "مسح القزحية",
};

export const ACCESS_RESULT_LABELS: Record<AccessResult, string> = {
  GRANTED: "Granted",
  DENIED: "Denied",
};

export const ACCESS_RESULT_LABELS_AR: Record<AccessResult, string> = {
  GRANTED: "مسموح",
  DENIED: "مرفوض",
};

export const DENIAL_REASON_LABELS: Record<DenialReason, string> = {
  EXPIRED_MEMBERSHIP: "Expired Membership",
  INVALID_CARD: "Invalid Card",
  TIME_RESTRICTED: "Time Restricted",
  ZONE_RESTRICTED: "Zone Restricted",
  CAPACITY_FULL: "Capacity Full",
  UNKNOWN_CREDENTIAL: "Unknown Credential",
  SUSPENDED_CARD: "Suspended Card",
  BIOMETRIC_MISMATCH: "Biometric Mismatch",
  MAINTENANCE_MODE: "Maintenance Mode",
};

export const DENIAL_REASON_LABELS_AR: Record<DenialReason, string> = {
  EXPIRED_MEMBERSHIP: "العضوية منتهية",
  INVALID_CARD: "بطاقة غير صالحة",
  TIME_RESTRICTED: "وقت محظور",
  ZONE_RESTRICTED: "منطقة محظورة",
  CAPACITY_FULL: "السعة ممتلئة",
  UNKNOWN_CREDENTIAL: "بيانات غير معروفة",
  SUSPENDED_CARD: "بطاقة موقوفة",
  BIOMETRIC_MISMATCH: "عدم تطابق البيومتري",
  MAINTENANCE_MODE: "وضع الصيانة",
};

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export const DAY_OF_WEEK_LABELS_AR: Record<number, string> = {
  0: "الأحد",
  1: "الإثنين",
  2: "الثلاثاء",
  3: "الأربعاء",
  4: "الخميس",
  5: "الجمعة",
  6: "السبت",
};
