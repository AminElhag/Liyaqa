"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  User,
  Users,
  Home,
  Building2,
  Clock,
  DollarSign,
  Calendar,
  Pencil,
  Plus,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import {
  usePTClass,
  useScheduledPTSessions,
} from "@liyaqa/shared/queries/use-pt-sessions";
import type { ClassSession } from "@liyaqa/shared/types/scheduling";
import { cn, getLocalizedText, formatCurrency, formatDate } from "@liyaqa/shared/utils";

// ---------------------------------------------------------------------------
// Bilingual texts
// ---------------------------------------------------------------------------

const texts = {
  en: {
    back: "Back to PT Classes",
    edit: "Edit",
    scheduleSession: "Schedule Session",
    // Info cards
    sessionType: "Session Type",
    locationType: "Location Type",
    capacity: "Capacity",
    duration: "Duration",
    pricing: "Pricing",
    travelFee: "Travel Fee",
    taxRate: "Tax Rate",
    pricingModel: "Pricing Model",
    // Session type labels
    oneOnOne: "1:1 (One-on-One)",
    semiPrivate: "Semi-Private",
    // Location labels
    club: "Club",
    home: "Home",
    // Pricing labels
    payPerEntry: "Pay Per Entry",
    includedInMembership: "Included in Membership",
    classPackOnly: "Class Pack Only",
    hybrid: "Hybrid",
    // Recent sessions
    recentSessions: "Recent Sessions",
    recentSessionsDesc: "Latest PT sessions for this class template",
    noSessions: "No sessions scheduled yet",
    noSessionsDesc: "Schedule a session from this class template to get started.",
    // Session table
    date: "Date",
    time: "Time",
    trainer: "Trainer",
    status: "Status",
    bookedSlots: "Booked",
    // Error
    errorTitle: "Failed to load PT class",
    errorDesc: "Something went wrong. Please try again.",
    retry: "Retry",
    // Misc
    min: "min",
    max: "max",
    people: "people",
    notAssigned: "Not assigned",
    notSet: "Not set",
    description: "Description",
  },
  ar: {
    back: "العودة لفصول التدريب الشخصي",
    edit: "تعديل",
    scheduleSession: "جدولة جلسة",
    // Info cards
    sessionType: "نوع الجلسة",
    locationType: "نوع الموقع",
    capacity: "السعة",
    duration: "المدة",
    pricing: "التسعير",
    travelFee: "رسوم التنقل",
    taxRate: "نسبة الضريبة",
    pricingModel: "نموذج التسعير",
    // Session type labels
    oneOnOne: "1:1 (جلسة فردية)",
    semiPrivate: "شبه خاص",
    // Location labels
    club: "النادي",
    home: "المنزل",
    // Pricing labels
    payPerEntry: "الدفع لكل جلسة",
    includedInMembership: "مشمول في العضوية",
    classPackOnly: "باقة حصص فقط",
    hybrid: "مختلط",
    // Recent sessions
    recentSessions: "الجلسات الأخيرة",
    recentSessionsDesc: "أحدث جلسات التدريب الشخصي لهذا القالب",
    noSessions: "لا توجد جلسات مجدولة بعد",
    noSessionsDesc: "قم بجدولة جلسة من هذا القالب للبدء.",
    // Session table
    date: "التاريخ",
    time: "الوقت",
    trainer: "المدرب",
    status: "الحالة",
    bookedSlots: "محجوز",
    // Error
    errorTitle: "فشل تحميل فصل التدريب الشخصي",
    errorDesc: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    retry: "إعادة المحاولة",
    // Misc
    min: "دقيقة",
    max: "أقصى",
    people: "أشخاص",
    notAssigned: "غير محدد",
    notSet: "غير محدد",
    description: "الوصف",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPricingModelLabel(model: string | undefined, t: (typeof texts)["en"]): string {
  switch (model) {
    case "PAY_PER_ENTRY": return t.payPerEntry;
    case "INCLUDED_IN_MEMBERSHIP": return t.includedInMembership;
    case "CLASS_PACK_ONLY": return t.classPackOnly;
    case "HYBRID": return t.hybrid;
    default: return "-";
  }
}

// ---------------------------------------------------------------------------
// Info Card component
// ---------------------------------------------------------------------------

function InfoCard({
  icon: Icon,
  label,
  value,
  subValue,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50",
          iconColor
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session row component
// ---------------------------------------------------------------------------

function SessionRow({
  session,
  locale,
  t,
}: {
  session: ClassSession;
  locale: string;
  t: (typeof texts)["en"];
}) {
  return (
    <Link
      href={`/${locale}/sessions/${session.id}`}
      className="block hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center justify-between gap-4 p-3 border-b last:border-b-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-medium">
              {formatDate(session.date, locale)}
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              {session.startTime?.slice(0, 5)} - {session.endTime?.slice(0, 5)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session.trainerName && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              <LocalizedText text={session.trainerName} />
            </span>
          )}
          <Badge variant="outline" className="text-xs">
            {session.bookedCount}/{session.capacity}
          </Badge>
          <StatusBadge status={session.status} locale={locale} />
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function PTClassDetailPage() {
  const locale = useLocale() as "en" | "ar";
  const params = useParams();
  const id = params.id as string;
  const t = texts[locale];
  const isRTL = locale === "ar";

  const { data: ptClass, isLoading, error, refetch } = usePTClass(id);

  const { data: sessionsData, isLoading: sessionsLoading } = useScheduledPTSessions(
    { size: 10 },
    { enabled: !!id }
  );

  // Filter sessions belonging to this class
  const recentSessions = useMemo(() => {
    if (!sessionsData?.content) return [];
    return sessionsData.content.filter((s) => s.classId === id);
  }, [sessionsData?.content, id]);

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (error || !ptClass) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Link
          href={`/${locale}/pt-classes`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackArrow className="h-4 w-4" />
          {t.back}
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-destructive">{t.errorTitle}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">{t.errorDesc}</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              {t.retry}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href={`/${locale}/pt-classes`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <BackArrow className="h-4 w-4" />
        {t.back}
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              "bg-gradient-to-br from-amber-100 to-orange-100",
              "dark:from-amber-900/40 dark:to-orange-900/40"
            )}
          >
            <Dumbbell className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {getLocalizedText(ptClass.name, locale)}
              </h1>
              <StatusBadge status={ptClass.status} locale={locale} />
            </div>
            {ptClass.trainerName && (
              <p className="text-muted-foreground mt-1">
                <LocalizedText text={ptClass.trainerName} />
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${locale}/pt-classes/${id}/edit`}>
              <Pencil className="me-2 h-4 w-4" />
              {t.edit}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/pt-schedule?classId=${id}`}>
              <Plus className="me-2 h-4 w-4" />
              {t.scheduleSession}
            </Link>
          </Button>
        </div>
      </div>

      {/* Description */}
      {ptClass.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground font-medium mb-1">{t.description}</p>
            <p>{getLocalizedText(ptClass.description, locale)}</p>
          </CardContent>
        </Card>
      )}

      {/* Info cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard
          icon={ptClass.ptSessionType === "ONE_ON_ONE" ? User : Users}
          label={t.sessionType}
          value={
            ptClass.ptSessionType === "ONE_ON_ONE"
              ? t.oneOnOne
              : t.semiPrivate
          }
        />

        <InfoCard
          icon={ptClass.ptLocationType === "HOME" ? Home : Building2}
          label={t.locationType}
          value={
            ptClass.ptLocationType === "HOME"
              ? t.home
              : t.club
          }
          subValue={
            ptClass.locationName
              ? getLocalizedText(ptClass.locationName, locale)
              : undefined
          }
        />

        <InfoCard
          icon={Users}
          label={t.capacity}
          value={
            ptClass.ptSessionType === "SEMI_PRIVATE"
              ? `${ptClass.minCapacity ?? 1} - ${ptClass.capacity} ${t.people}`
              : `1 ${t.people}`
          }
        />

        <InfoCard
          icon={Clock}
          label={t.duration}
          value={`${ptClass.durationMinutes} ${t.min}`}
        />

        <InfoCard
          icon={DollarSign}
          label={t.pricing}
          value={
            ptClass.dropInPrice
              ? formatCurrency(ptClass.dropInPrice.amount, ptClass.dropInPrice.currency, locale)
              : t.notSet
          }
          subValue={getPricingModelLabel(ptClass.pricingModel, t)}
        />

        {ptClass.ptLocationType === "HOME" && (
          <InfoCard
            icon={MapPin}
            label={t.travelFee}
            value={
              ptClass.travelFee
                ? formatCurrency(ptClass.travelFee.amount, ptClass.travelFee.currency, locale)
                : t.notSet
            }
          />
        )}

        {ptClass.taxRate !== undefined && ptClass.taxRate !== null && (
          <InfoCard
            icon={DollarSign}
            label={t.taxRate}
            value={`${ptClass.taxRate}%`}
          />
        )}
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>{t.recentSessions}</CardTitle>
          <CardDescription>{t.recentSessionsDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loading />
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium">{t.noSessions}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.noSessionsDesc}</p>
              <Button asChild className="mt-4" size="sm">
                <Link href={`/${locale}/pt-schedule?classId=${id}`}>
                  <Plus className="me-2 h-4 w-4" />
                  {t.scheduleSession}
                </Link>
              </Button>
            </div>
          ) : (
            <div>
              {recentSessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
