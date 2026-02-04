/**
 * Islamic Calendar Types
 * Supports Hijri calendar for Saudi Arabia market
 */

// Hijri Month names
export const HIJRI_MONTHS_EN = [
  "Muharram",
  "Safar",
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qi'dah",
  "Dhu al-Hijjah",
] as const;

export const HIJRI_MONTHS_AR = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الثاني",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
] as const;

// Islamic events
export type IslamicEventCode =
  | "ISLAMIC_NEW_YEAR"
  | "ASHURA"
  | "MAWLID_NABI"
  | "ISRA_MIRAJ"
  | "MID_SHABAN"
  | "RAMADAN_START"
  | "LAYLAT_AL_QADR"
  | "EID_AL_FITR"
  | "DAY_OF_ARAFAH"
  | "EID_AL_ADHA";

export interface HijriDateResponse {
  hijriYear: number;
  hijriMonth: number;
  hijriDay: number;
  hijriDateIso: string;
  hijriDateFormattedEn: string;
  hijriDateFormattedAr: string;
  monthNameEn: string;
  monthNameAr: string;
  gregorianDate: string;
  daysInMonth?: number;
  currentDayOfMonth?: number;
}

export interface GregorianDateResponse {
  gregorianDate: string;
  dayOfWeek: string;
  hijriDateFormatted: string;
  hijriDateFormattedAr: string;
}

export interface IslamicEventDto {
  code: IslamicEventCode;
  nameEn: string;
  nameAr: string;
  hijriDate: string;
  hijriDateFormattedEn: string;
  hijriDateFormattedAr: string;
  gregorianDate?: string;
  isPublicHoliday: boolean;
}

export interface IslamicEventsResponse {
  hijriYear: number;
  events: IslamicEventDto[];
}

export interface HijriMonthInfoResponse {
  year: number;
  month: number;
  monthNameEn: string;
  monthNameAr: string;
  daysInMonth: number;
  currentDay: number;
}

export interface RamadanInfoResponse {
  isCurrentlyRamadan: boolean;
  daysUntilRamadan: number;
  hijriYear: number;
  startDate: string;
  endDate: string;
  messageEn: string;
  messageAr: string;
}

export interface HijriMonthName {
  number: number;
  nameEn: string;
  nameAr: string;
}

// Helper function to get month name
export function getHijriMonthName(month: number, locale: "en" | "ar" = "en"): string {
  if (month < 1 || month > 12) return "";
  return locale === "ar" ? HIJRI_MONTHS_AR[month - 1] : HIJRI_MONTHS_EN[month - 1];
}

// Islamic event translations
export const ISLAMIC_EVENTS: Record<IslamicEventCode, { en: string; ar: string }> = {
  ISLAMIC_NEW_YEAR: { en: "Islamic New Year", ar: "رأس السنة الهجرية" },
  ASHURA: { en: "Day of Ashura", ar: "يوم عاشوراء" },
  MAWLID_NABI: { en: "Prophet's Birthday", ar: "المولد النبوي الشريف" },
  ISRA_MIRAJ: { en: "Isra and Mi'raj", ar: "الإسراء والمعراج" },
  MID_SHABAN: { en: "Mid-Sha'ban", ar: "ليلة النصف من شعبان" },
  RAMADAN_START: { en: "First Day of Ramadan", ar: "بداية شهر رمضان" },
  LAYLAT_AL_QADR: { en: "Laylat al-Qadr", ar: "ليلة القدر" },
  EID_AL_FITR: { en: "Eid al-Fitr", ar: "عيد الفطر" },
  DAY_OF_ARAFAH: { en: "Day of Arafah", ar: "يوم عرفة" },
  EID_AL_ADHA: { en: "Eid al-Adha", ar: "عيد الأضحى" },
};
