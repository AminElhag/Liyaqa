"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Users,
  Sparkles,
  Shield,
  Tag,
  User,
  CalendarCheck,
  AlertCircle,
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
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { useClass } from "@liyaqa/shared/queries/use-classes";
import { useUpcomingSessionsByClass } from "@liyaqa/shared/queries/use-classes";
import { cn } from "@liyaqa/shared/lib/utils";
import type {
  GymClass,
  ClassSession,
  ClassType,
  DifficultyLevel,
  ClassAccessPolicy,
  SessionStatus,
} from "@liyaqa/shared/types/scheduling";

// ---------------------------------------------------------------------------
// Bilingual texts
// ---------------------------------------------------------------------------
const texts = {
  en: {
    back: "Back to Classes",
    upcomingSessions: "Upcoming Sessions",
    noSessions: "No upcoming sessions",
    noSessionsHint:
      "There are no scheduled sessions for this class right now. Check back later.",
    duration: "min",
    capacity: "spots",
    spotsLeft: "spots left",
    spotsTaken: "spots taken",
    bookNow: "Book Now",
    joinWaitlist: "Join Waitlist",
    cancelled: "Cancelled",
    full: "Full",
    scheduled: "Scheduled",
    inProgress: "In Progress",
    completed: "Completed",
    instructor: "Instructor",
    included: "Included",
    packOnly: "Pack Only",
    free: "Free",
    maleOnly: "Male Only",
    femaleOnly: "Female Only",
    classNotFound: "Class not found",
    classNotFoundHint: "The class you are looking for does not exist.",
    errorLoading: "Failed to load class details",
  },
  ar: {
    back: "العودة للحصص",
    upcomingSessions: "الحصص القادمة",
    noSessions: "لا توجد حصص قادمة",
    noSessionsHint:
      "لا توجد حصص مجدولة لهذه الحصة حالياً. تحقق لاحقاً.",
    duration: "دقيقة",
    capacity: "مقاعد",
    spotsLeft: "مقاعد متاحة",
    spotsTaken: "مقاعد محجوزة",
    bookNow: "احجز الآن",
    joinWaitlist: "انضم لقائمة الانتظار",
    cancelled: "ملغاة",
    full: "مكتملة",
    scheduled: "مجدولة",
    inProgress: "جارية",
    completed: "مكتملة",
    instructor: "المدرب",
    included: "مشمولة",
    packOnly: "باقة فقط",
    free: "مجاناً",
    maleOnly: "رجال فقط",
    femaleOnly: "نساء فقط",
    classNotFound: "الحصة غير موجودة",
    classNotFoundHint: "الحصة التي تبحث عنها غير موجودة.",
    errorLoading: "فشل في تحميل تفاصيل الحصة",
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
// Session status config
// ---------------------------------------------------------------------------
const SESSION_STATUS_CONFIG: Record<
  SessionStatus,
  { en: string; ar: string; color: string }
> = {
  SCHEDULED: { en: "Scheduled", ar: "مجدولة", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  IN_PROGRESS: { en: "In Progress", ar: "جارية", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  COMPLETED: { en: "Completed", ar: "مكتملة", color: "bg-muted text-muted-foreground" },
  CANCELLED: { en: "Cancelled", ar: "ملغاة", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

// ---------------------------------------------------------------------------
// Day labels
// ---------------------------------------------------------------------------
const DAY_LABELS: Record<string, { en: string; ar: string }> = {
  0: { en: "Sunday", ar: "الأحد" },
  1: { en: "Monday", ar: "الاثنين" },
  2: { en: "Tuesday", ar: "الثلاثاء" },
  3: { en: "Wednesday", ar: "الأربعاء" },
  4: { en: "Thursday", ar: "الخميس" },
  5: { en: "Friday", ar: "الجمعة" },
  6: { en: "Saturday", ar: "السبت" },
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
// Helper: format time string (HH:mm:ss -> HH:mm)
// ---------------------------------------------------------------------------
function formatTime(time: string): string {
  return time.slice(0, 5);
}

// ---------------------------------------------------------------------------
// Helper: format session date
// ---------------------------------------------------------------------------
function formatSessionDate(
  dateStr: string,
  locale: string
): { formatted: string; dayOfWeek: string } {
  const date = parseISO(dateStr);
  const dateFnsLocale = locale === "ar" ? arLocale : enUS;
  const dayIndex = date.getDay();
  const dayLabel = DAY_LABELS[dayIndex];
  const dayOfWeek = locale === "ar" ? dayLabel.ar : dayLabel.en;
  const formatted = format(date, "dd MMM yyyy", { locale: dateFnsLocale });
  return { formatted, dayOfWeek };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function MemberClassDetailPage() {
  const params = useParams();
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = isAr ? texts.ar : texts.en;
  const classId = params.classId as string;

  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  const {
    data: gymClass,
    isLoading: classLoading,
    error: classError,
  } = useClass(classId);

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
  } = useUpcomingSessionsByClass(classId, { size: 20 });

  const sessions = useMemo(() => {
    if (!sessionsData) return [];
    return sessionsData.content ?? [];
  }, [sessionsData]);

  // -- Loading state --
  if (classLoading) {
    return <ClassDetailSkeleton />;
  }

  // -- Error state --
  if (classError) {
    return (
      <div className="space-y-6">
        <BackLink locale={locale} t={t} BackArrow={BackArrow} />
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">
              {t.errorLoading}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -- Not found --
  if (!gymClass) {
    return (
      <div className="space-y-6">
        <BackLink locale={locale} t={t} BackArrow={BackArrow} />
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">
              {t.classNotFound}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {t.classNotFoundHint}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const colorCode = gymClass.colorCode || "#FF6B4A";
  const classType = gymClass.classType || "OTHER";
  const typeConfig = CLASS_TYPE_CONFIG[classType];
  const diffConfig = DIFFICULTY_CONFIG[gymClass.difficultyLevel];
  const accessConfig = ACCESS_POLICY_CONFIG[gymClass.accessPolicy];
  const pricing = getPricingDisplay(gymClass, t);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <BackLink locale={locale} t={t} BackArrow={BackArrow} />

      {/* Class header card */}
      <Card className="overflow-hidden">
        {/* Color accent bar */}
        <div className="h-2 w-full" style={{ backgroundColor: colorCode }} />

        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold leading-tight">
            <LocalizedText text={gymClass.name} fallback="Untitled Class" />
          </CardTitle>

          {/* Description */}
          {gymClass.description && (
            <p className="text-muted-foreground mt-1">
              <LocalizedText text={gymClass.description} />
            </p>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
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
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            {/* Duration */}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {gymClass.durationMinutes} {t.duration}
            </span>

            {/* Capacity */}
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {gymClass.capacity} {t.capacity}
            </span>

            {/* Pricing */}
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

            {/* Trainer */}
            {gymClass.trainerName && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <LocalizedText text={gymClass.trainerName} />
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Sessions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          {t.upcomingSessions}
        </h2>

        {sessionsLoading ? (
          <SessionsSkeleton />
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">
                {t.noSessions}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {t.noSessionsHint}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                locale={locale}
                t={t}
                colorCode={colorCode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Back link component
// ---------------------------------------------------------------------------
function BackLink({
  locale,
  t,
  BackArrow,
}: {
  locale: string;
  t: (typeof texts)["en"];
  BackArrow: typeof ArrowLeft;
}) {
  return (
    <Button asChild variant="ghost" size="sm" className="gap-1.5">
      <Link href={`/${locale}/members/classes`}>
        <BackArrow className="h-4 w-4" />
        {t.back}
      </Link>
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Session card component
// ---------------------------------------------------------------------------
function SessionCard({
  session,
  locale,
  t,
  colorCode,
}: {
  session: ClassSession;
  locale: string;
  t: (typeof texts)["en"];
  colorCode: string;
}) {
  const isAr = locale === "ar";
  const { formatted: dateFormatted, dayOfWeek } = formatSessionDate(
    session.date,
    locale
  );
  const timeRange = `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`;
  const isFull = session.availableSpots <= 0;
  const isCancelled = session.status === "CANCELLED";
  const isCompleted = session.status === "COMPLETED";
  const isBookable = session.status === "SCHEDULED" && !isFull;
  const statusConfig = SESSION_STATUS_CONFIG[session.status];
  const spotsFraction = `${session.bookedCount}/${session.capacity}`;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Color accent */}
      <div className="h-1 w-full" style={{ backgroundColor: colorCode }} />

      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          {/* Left: date + time + instructor */}
          <div className="space-y-2 flex-1 min-w-0">
            {/* Date and day */}
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-semibold text-foreground">
                {dayOfWeek}
              </span>
              <span className="text-sm text-muted-foreground">
                {dateFormatted}
              </span>
            </div>

            {/* Time range */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground">{timeRange}</span>
            </div>

            {/* Instructor */}
            {session.trainerName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">
                  <LocalizedText text={session.trainerName} />
                </span>
              </div>
            )}

            {/* Spots info */}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">
                {spotsFraction} {t.spotsTaken}
              </span>
              {!isCancelled && !isCompleted && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    isFull
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      : session.availableSpots <= 3
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  )}
                >
                  {isFull
                    ? t.full
                    : `${session.availableSpots} ${t.spotsLeft}`}
                </Badge>
              )}
            </div>
          </div>

          {/* Right: status + action */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Status badge */}
            <Badge
              variant="outline"
              className={cn("text-xs", statusConfig.color)}
            >
              {isAr ? statusConfig.ar : statusConfig.en}
            </Badge>

            {/* Action button */}
            {isCancelled ? (
              <Button variant="outline" size="sm" disabled className="w-full sm:w-auto">
                {t.cancelled}
              </Button>
            ) : isCompleted ? (
              <Button variant="outline" size="sm" disabled className="w-full sm:w-auto">
                {t.completed}
              </Button>
            ) : isFull ? (
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                {t.joinWaitlist}
              </Button>
            ) : isBookable ? (
              <Button size="sm" className="w-full sm:w-auto">
                {t.bookNow}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Class detail skeleton
// ---------------------------------------------------------------------------
function ClassDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back button skeleton */}
      <Skeleton className="h-9 w-36" />

      {/* Header card skeleton */}
      <Card className="overflow-hidden">
        <Skeleton className="h-2 w-full rounded-none" />
        <CardHeader className="pb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
          <div className="flex gap-2 mt-3">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="flex gap-6">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-28" />
          </div>
        </CardContent>
      </Card>

      {/* Sessions heading skeleton */}
      <Skeleton className="h-7 w-48" />

      {/* Session cards skeleton */}
      <SessionsSkeleton />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sessions skeleton
// ---------------------------------------------------------------------------
function SessionsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-1 w-full rounded-none" />
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
