/**
 * Prayer Time types for Saudi Arabia market features.
 */

// ==================== ENUMS ====================

export type PrayerCalculationMethod =
  | "UMM_AL_QURA"
  | "MUSLIM_WORLD_LEAGUE"
  | "EGYPTIAN"
  | "KARACHI"
  | "ISNA"
  | "UOIF"
  | "DUBAI"
  | "QATAR"
  | "KUWAIT"
  | "SINGAPORE";

export type PrayerName = "FAJR" | "SUNRISE" | "DHUHR" | "ASR" | "MAGHRIB" | "ISHA";

// ==================== PRAYER TIME RESPONSES ====================

export interface PrayerTimeResponse {
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface NextPrayerResponse {
  name: PrayerName;
  time: string;
}

export interface CheckInStatusResponse {
  blocked: boolean;
  currentPrayer: PrayerName | null;
  messageEn: string | null;
  messageAr: string | null;
}

export interface PrayerSettingsResponse {
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  calculationMethod: PrayerCalculationMethod;
  bufferMinutes: number;
  blockCheckinDuringPrayer: boolean;
  isConfigured: boolean;
}

// ==================== CITY INFO ====================

export interface CityInfo {
  name: string;
  nameAr: string;
  latitude: number;
  longitude: number;
}

export interface SupportedCitiesResponse {
  cities: CityInfo[];
}

// ==================== CALCULATION METHOD INFO ====================

export interface CalculationMethodInfo {
  code: PrayerCalculationMethod;
  nameEn: string;
  nameAr: string;
  description: string;
}

// ==================== UPDATE REQUEST ====================

export interface UpdatePrayerSettingsRequest {
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  calculationMethod?: PrayerCalculationMethod | null;
  bufferMinutes?: number | null;
  blockCheckinDuringPrayer?: boolean | null;
}

// ==================== HELPER TYPES ====================

export interface PrayerTimeItem {
  name: PrayerName;
  nameEn: string;
  nameAr: string;
  time: string;
  isPast: boolean;
  isNext: boolean;
}

// Prayer name translations
export const PRAYER_NAMES: Record<PrayerName, { en: string; ar: string }> = {
  FAJR: { en: "Fajr", ar: "الفجر" },
  SUNRISE: { en: "Sunrise", ar: "الشروق" },
  DHUHR: { en: "Dhuhr", ar: "الظهر" },
  ASR: { en: "Asr", ar: "العصر" },
  MAGHRIB: { en: "Maghrib", ar: "المغرب" },
  ISHA: { en: "Isha", ar: "العشاء" },
};

// Calculation method translations
export const CALCULATION_METHODS: Record<
  PrayerCalculationMethod,
  { en: string; ar: string; description: string }
> = {
  UMM_AL_QURA: {
    en: "Umm Al-Qura (Saudi Arabia)",
    ar: "أم القرى (السعودية)",
    description: "Official method used in Saudi Arabia",
  },
  MUSLIM_WORLD_LEAGUE: {
    en: "Muslim World League",
    ar: "رابطة العالم الإسلامي",
    description: "Used in Europe, Far East, parts of US",
  },
  EGYPTIAN: {
    en: "Egyptian General Authority",
    ar: "الهيئة المصرية العامة للمساحة",
    description: "Used in Africa, Syria, Lebanon, Malaysia",
  },
  KARACHI: {
    en: "University of Karachi",
    ar: "جامعة كراتشي",
    description: "Used in Pakistan, Bangladesh, India, Afghanistan",
  },
  ISNA: {
    en: "Islamic Society of North America",
    ar: "الجمعية الإسلامية لأمريكا الشمالية",
    description: "Used in North America",
  },
  UOIF: {
    en: "Union of Islamic Orgs (France)",
    ar: "اتحاد المنظمات الإسلامية (فرنسا)",
    description: "Used in France",
  },
  DUBAI: {
    en: "Dubai",
    ar: "دبي",
    description: "Used in UAE",
  },
  QATAR: {
    en: "Qatar",
    ar: "قطر",
    description: "Used in Qatar",
  },
  KUWAIT: {
    en: "Kuwait",
    ar: "الكويت",
    description: "Used in Kuwait",
  },
  SINGAPORE: {
    en: "Singapore",
    ar: "سنغافورة",
    description: "Used in Singapore",
  },
};
