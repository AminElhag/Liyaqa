"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Search,
  Clock,
  Users,
  Dumbbell,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Sparkles,
  Shield,
  Tag,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Input } from "@liyaqa/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { useActiveClasses } from "@liyaqa/shared/queries/use-classes";
import { cn } from "@liyaqa/shared/lib/utils";
import type {
  GymClass,
  ClassType,
  DifficultyLevel,
  ClassAccessPolicy,
} from "@liyaqa/shared/types/scheduling";

// ---------------------------------------------------------------------------
// Bilingual texts
// ---------------------------------------------------------------------------
const texts = {
  en: {
    title: "Class Schedule",
    subtitle: "Browse available classes and book your next session",
    searchPlaceholder: "Search classes...",
    classType: "Class Type",
    difficulty: "Difficulty",
    allTypes: "All Types",
    allLevels: "All Levels",
    duration: "min",
    capacity: "spots",
    viewSessions: "View Sessions",
    noClasses: "No classes found",
    noClassesHint: "Try adjusting your filters or check back later.",
    clearFilters: "Clear filters",
    nextSession: "Next session",
    included: "Included",
    packOnly: "Pack Only",
    free: "Free",
    maleOnly: "Male Only",
    femaleOnly: "Female Only",
  },
  ar: {
    title: "جدول الحصص",
    subtitle: "تصفح الحصص المتاحة واحجز حصتك القادمة",
    searchPlaceholder: "بحث عن حصص...",
    classType: "نوع الحصة",
    difficulty: "المستوى",
    allTypes: "جميع الأنواع",
    allLevels: "جميع المستويات",
    duration: "دقيقة",
    capacity: "مقاعد",
    viewSessions: "عرض الحصص",
    noClasses: "لا توجد حصص",
    noClassesHint: "حاول تعديل الفلاتر أو تحقق لاحقاً.",
    clearFilters: "مسح الفلاتر",
    nextSession: "الحصة القادمة",
    included: "مشمولة",
    packOnly: "باقة فقط",
    free: "مجاناً",
    maleOnly: "رجال فقط",
    femaleOnly: "نساء فقط",
  },
};

// ---------------------------------------------------------------------------
// Class type config
// ---------------------------------------------------------------------------
const CLASS_TYPE_CONFIG: Record<
  ClassType,
  { en: string; ar: string; color: string }
> = {
  YOGA: { en: "Yoga", ar: "يوغا", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  PILATES: { en: "Pilates", ar: "بيلاتس", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  SPINNING: { en: "Spinning", ar: "سبينينغ", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  CROSSFIT: { en: "CrossFit", ar: "كروس فيت", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  SWIMMING: { en: "Swimming", ar: "سباحة", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
  MARTIAL_ARTS: { en: "Martial Arts", ar: "فنون قتالية", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  DANCE: { en: "Dance", ar: "رقص", color: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300" },
  GROUP_FITNESS: { en: "Group Fitness", ar: "لياقة جماعية", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  PERSONAL_TRAINING: { en: "Personal Training", ar: "تدريب شخصي", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  OTHER: { en: "Other", ar: "أخرى", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300" },
};

// ---------------------------------------------------------------------------
// Difficulty config
// ---------------------------------------------------------------------------
const DIFFICULTY_CONFIG: Record<
  DifficultyLevel,
  { en: string; ar: string; color: string }
> = {
  ALL_LEVELS: { en: "All Levels", ar: "جميع المستويات", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  BEGINNER: { en: "Beginner", ar: "مبتدئ", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  INTERMEDIATE: { en: "Intermediate", ar: "متوسط", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  ADVANCED: { en: "Advanced", ar: "متقدم", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

// ---------------------------------------------------------------------------
// Access policy config
// ---------------------------------------------------------------------------
const ACCESS_POLICY_CONFIG: Record<
  ClassAccessPolicy,
  { en: string; ar: string; color: string }
> = {
  MEMBERS_ONLY: { en: "Members Only", ar: "للأعضاء فقط", color: "bg-muted text-muted-foreground" },
  SPECIFIC_MEMBERSHIPS: { en: "Specific Plans", ar: "باقات محددة", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  OPEN_TO_ANYONE: { en: "Open", ar: "مفتوح للجميع", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
};

// ---------------------------------------------------------------------------
// Helper: get pricing display for a class
// ---------------------------------------------------------------------------
function getPricingDisplay(
  gymClass: GymClass,
  t: (typeof texts)["en"]
): { label: string; variant: "default" | "success" | "secondary" } {
  const model = gymClass.pricingModel;

  if (model === "INCLUDED_IN_MEMBERSHIP") {
    return { label: t.included, variant: "success" };
  }

  if (model === "CLASS_PACK_ONLY") {
    return { label: t.packOnly, variant: "secondary" };
  }

  if (model === "PAY_PER_ENTRY" && gymClass.dropInPrice) {
    const amount = gymClass.dropInPrice.amount;
    const currency = gymClass.dropInPrice.currency || "SAR";
    return {
      label: `${currency} ${amount}`,
      variant: "default",
    };
  }

  if (model === "HYBRID" && gymClass.dropInPrice) {
    const amount = gymClass.dropInPrice.amount;
    const currency = gymClass.dropInPrice.currency || "SAR";
    return {
      label: `${t.included} / ${currency} ${amount}`,
      variant: "default",
    };
  }

  return { label: t.free, variant: "success" };
}

// ---------------------------------------------------------------------------
// Helper: get next session date from schedules
// ---------------------------------------------------------------------------
function getNextSessionDay(
  schedules: GymClass["schedules"],
  locale: string
): string | null {
  if (!schedules || schedules.length === 0) return null;

  const dayOrder = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  const dayLabels: Record<string, { en: string; ar: string }> = {
    SUNDAY: { en: "Sun", ar: "أحد" },
    MONDAY: { en: "Mon", ar: "اثنين" },
    TUESDAY: { en: "Tue", ar: "ثلاثاء" },
    WEDNESDAY: { en: "Wed", ar: "أربعاء" },
    THURSDAY: { en: "Thu", ar: "خميس" },
    FRIDAY: { en: "Fri", ar: "جمعة" },
    SATURDAY: { en: "Sat", ar: "سبت" },
  };

  const today = new Date().getDay(); // 0=Sunday
  const sorted = [...schedules].sort((a, b) => {
    const aIdx = dayOrder.indexOf(a.dayOfWeek);
    const bIdx = dayOrder.indexOf(b.dayOfWeek);
    // Sort relative to today
    const aDist = (aIdx - today + 7) % 7;
    const bDist = (bIdx - today + 7) % 7;
    return aDist - bDist;
  });

  const next = sorted[0];
  const label = dayLabels[next.dayOfWeek];
  const dayText = locale === "ar" ? label.ar : label.en;
  const time = next.startTime?.slice(0, 5) ?? "";
  return `${dayText} ${time}`;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function MemberClassSchedulePage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = isAr ? texts.ar : texts.en;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ClassType>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<
    "all" | DifficultyLevel
  >("all");

  const { data: classes, isLoading, error } = useActiveClasses();

  // Client-side filtering
  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    return classes.filter((gc) => {
      // Type filter
      if (typeFilter !== "all" && gc.classType !== typeFilter) return false;

      // Difficulty filter
      if (difficultyFilter !== "all" && gc.difficultyLevel !== difficultyFilter)
        return false;

      // Search filter (name)
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const nameEn = gc.name?.en?.toLowerCase() ?? "";
        const nameAr = gc.name?.ar?.toLowerCase() ?? "";
        if (!nameEn.includes(q) && !nameAr.includes(q)) return false;
      }

      return true;
    });
  }, [classes, typeFilter, difficultyFilter, search]);

  const hasFilters =
    typeFilter !== "all" || difficultyFilter !== "all" || search.trim() !== "";

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>

            {/* Class type */}
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as "all" | ClassType)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t.classType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allTypes}</SelectItem>
                {(Object.keys(CLASS_TYPE_CONFIG) as ClassType[]).map((ct) => (
                  <SelectItem key={ct} value={ct}>
                    {isAr ? CLASS_TYPE_CONFIG[ct].ar : CLASS_TYPE_CONFIG[ct].en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Difficulty */}
            <Select
              value={difficultyFilter}
              onValueChange={(v) =>
                setDifficultyFilter(v as "all" | DifficultyLevel)
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t.difficulty} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allLevels}</SelectItem>
                {(Object.keys(DIFFICULTY_CONFIG) as DifficultyLevel[]).map(
                  (dl) => (
                    <SelectItem key={dl} value={dl}>
                      {isAr
                        ? DIFFICULTY_CONFIG[dl].ar
                        : DIFFICULTY_CONFIG[dl].en}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-2 w-full">
                <Skeleton className="h-full w-full rounded-none" />
              </div>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-40" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {isAr
              ? "فشل في تحميل الحصص"
              : "Failed to load classes"}
          </CardContent>
        </Card>
      )}

      {/* Class cards grid */}
      {!isLoading && !error && (
        <>
          {filteredClasses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Dumbbell className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">
                  {t.noClasses}
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {t.noClassesHint}
                </p>
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setSearch("");
                      setTypeFilter("all");
                      setDifficultyFilter("all");
                    }}
                  >
                    {t.clearFilters}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClasses.map((gc) => (
                <ClassCard
                  key={gc.id}
                  gymClass={gc}
                  locale={locale}
                  t={t}
                  ArrowIcon={ArrowIcon}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Class card component
// ---------------------------------------------------------------------------
function ClassCard({
  gymClass,
  locale,
  t,
  ArrowIcon,
}: {
  gymClass: GymClass;
  locale: string;
  t: (typeof texts)["en"];
  ArrowIcon: typeof ArrowRight;
}) {
  const isAr = locale === "ar";
  const colorCode = gymClass.colorCode || "#FF6B4A";

  const classType = gymClass.classType || "OTHER";
  const typeConfig = CLASS_TYPE_CONFIG[classType];
  const diffConfig = DIFFICULTY_CONFIG[gymClass.difficultyLevel];
  const accessConfig = ACCESS_POLICY_CONFIG[gymClass.accessPolicy];
  const pricing = getPricingDisplay(gymClass, t);
  const nextSession = getNextSessionDay(gymClass.schedules, locale);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group">
      {/* Color accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: colorCode }} />

      <CardHeader className="pb-3">
        <CardTitle className="text-lg leading-tight">
          <LocalizedText text={gymClass.name} fallback="Untitled Class" />
        </CardTitle>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {/* Class type badge */}
          <Badge variant="outline" className={cn("text-xs", typeConfig.color)}>
            {isAr ? typeConfig.ar : typeConfig.en}
          </Badge>

          {/* Difficulty badge */}
          <Badge variant="outline" className={cn("text-xs", diffConfig.color)}>
            <Sparkles className="h-3 w-3 me-1" />
            {isAr ? diffConfig.ar : diffConfig.en}
          </Badge>

          {/* Access policy badge */}
          <Badge
            variant="outline"
            className={cn("text-xs", accessConfig.color)}
          >
            <Shield className="h-3 w-3 me-1" />
            {isAr ? accessConfig.ar : accessConfig.en}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Duration & capacity */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {gymClass.durationMinutes} {t.duration}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {gymClass.capacity} {t.capacity}
          </span>
        </div>

        {/* Pricing badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant={
              pricing.variant === "success"
                ? "default"
                : pricing.variant === "secondary"
                  ? "secondary"
                  : "outline"
            }
            className={cn(
              "text-xs",
              pricing.variant === "success" &&
                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100"
            )}
          >
            <Tag className="h-3 w-3 me-1" />
            {pricing.label}
          </Badge>

          {/* Gender restriction badge */}
          {(gymClass as GymClass & { genderRestriction?: string })
            .genderRestriction &&
            (gymClass as GymClass & { genderRestriction?: string })
              .genderRestriction !== "MIXED" && (
              <Badge variant="outline" className="text-xs">
                {(gymClass as GymClass & { genderRestriction?: string })
                  .genderRestriction === "MALE"
                  ? t.maleOnly
                  : t.femaleOnly}
              </Badge>
            )}
        </div>

        {/* Next session */}
        {nextSession && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {t.nextSession}: {nextSession}
          </p>
        )}

        {/* Trainer */}
        {gymClass.trainerName && (
          <p className="text-xs text-muted-foreground truncate">
            <LocalizedText text={gymClass.trainerName} />
          </p>
        )}

        {/* CTA */}
        <Button asChild className="w-full mt-1" variant="outline">
          <Link href={`/${locale}/members/classes/${gymClass.id}`}>
            {t.viewSessions}
            <ArrowIcon className="h-4 w-4 ms-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
