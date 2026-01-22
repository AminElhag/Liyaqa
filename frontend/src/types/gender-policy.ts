/**
 * Gender Policy types for Saudi Arabia market features.
 */

// ==================== ENUMS ====================

export type GenderPolicy = "MIXED" | "MALE_ONLY" | "FEMALE_ONLY" | "TIME_BASED";
export type AccessGender = "MALE" | "FEMALE";
export type GenderRestriction = "MIXED" | "MALE_ONLY" | "FEMALE_ONLY";
export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

// ==================== RESPONSES ====================

export interface GenderPolicyResponse {
  locationId: string;
  policy: GenderPolicy;
  messageEn: string;
  messageAr: string;
}

export interface GenderAccessResponse {
  allowed: boolean;
  policy: GenderPolicy;
  currentGender: AccessGender | null;
  reasonEn: string;
  reasonAr: string;
  scheduleEnd: string | null;
}

export interface CurrentGenderStatusResponse {
  policy: GenderPolicy;
  currentGender: AccessGender | null;
  allowsMale: boolean;
  allowsFemale: boolean;
  scheduleEnd: string | null;
  statusTextEn: string;
  statusTextAr: string;
}

export interface GenderScheduleResponse {
  id: string;
  locationId: string;
  dayOfWeek: DayOfWeek;
  dayOfWeekAr: string;
  startTime: string;
  endTime: string;
  gender: AccessGender;
  genderTextEn: string;
  genderTextAr: string;
}

export interface GenderPolicyInfo {
  code: GenderPolicy;
  nameEn: string;
  nameAr: string;
  description: string;
}

// ==================== REQUESTS ====================

export interface UpdateGenderPolicyRequest {
  policy: GenderPolicy;
}

export interface CreateGenderScheduleRequest {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  gender: AccessGender;
}

export interface UpdateGenderScheduleRequest {
  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  gender?: AccessGender;
}

// ==================== HELPER TYPES ====================

// Gender policy translations
export const GENDER_POLICIES: Record<
  GenderPolicy,
  { en: string; ar: string; description: string }
> = {
  MIXED: {
    en: "Mixed",
    ar: "مختلط",
    description: "Open to all genders at all times",
  },
  MALE_ONLY: {
    en: "Male Only",
    ar: "رجال فقط",
    description: "Exclusively for male members",
  },
  FEMALE_ONLY: {
    en: "Female Only",
    ar: "نساء فقط",
    description: "Exclusively for female members",
  },
  TIME_BASED: {
    en: "Time-Based",
    ar: "حسب الوقت",
    description: "Switches between male and female based on schedule",
  },
};

// Gender translations
export const GENDERS: Record<AccessGender, { en: string; ar: string }> = {
  MALE: { en: "Male", ar: "رجال" },
  FEMALE: { en: "Female", ar: "نساء" },
};

// Day of week translations
export const DAYS_OF_WEEK: Record<DayOfWeek, { en: string; ar: string }> = {
  MONDAY: { en: "Monday", ar: "الإثنين" },
  TUESDAY: { en: "Tuesday", ar: "الثلاثاء" },
  WEDNESDAY: { en: "Wednesday", ar: "الأربعاء" },
  THURSDAY: { en: "Thursday", ar: "الخميس" },
  FRIDAY: { en: "Friday", ar: "الجمعة" },
  SATURDAY: { en: "Saturday", ar: "السبت" },
  SUNDAY: { en: "Sunday", ar: "الأحد" },
};

// Gender restriction translations
export const GENDER_RESTRICTIONS: Record<
  GenderRestriction,
  { en: string; ar: string }
> = {
  MIXED: { en: "Mixed (All Genders)", ar: "مختلط (جميع الجنسين)" },
  MALE_ONLY: { en: "Male Only", ar: "رجال فقط" },
  FEMALE_ONLY: { en: "Female Only", ar: "نساء فقط" },
};
