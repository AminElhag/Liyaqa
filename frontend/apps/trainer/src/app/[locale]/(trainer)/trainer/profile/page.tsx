"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  UserCircle,
  Mail,
  Award,
  Calendar,
  Clock,
  Dumbbell,
  ArrowUpRight,
  Star,
  MapPin,
  Briefcase,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { useTrainerDashboard } from "@liyaqa/shared/queries/use-trainer-portal";
import { cn } from "@liyaqa/shared/utils";

const text = {
  title: { en: "Profile", ar: "الملف الشخصي" },
  subtitle: { en: "Your trainer profile", ar: "ملفك الشخصي كمدرب" },
  personalInfo: { en: "Personal Information", ar: "المعلومات الشخصية" },
  name: { en: "Name", ar: "الاسم" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  status: { en: "Status", ar: "الحالة" },
  type: { en: "Trainer Type", ar: "نوع المدرب" },
  specializations: { en: "Specializations", ar: "التخصصات" },
  noSpecializations: { en: "No specializations listed", ar: "لا توجد تخصصات مدرجة" },
  overview: { en: "Overview", ar: "نظرة عامة" },
  totalClients: { en: "Total Clients", ar: "إجمالي العملاء" },
  activeClients: { en: "Active Clients", ar: "العملاء النشطون" },
  sessionsCompleted: { en: "Sessions Completed", ar: "جلسات مكتملة" },
  manageAvailability: { en: "Manage Availability", ar: "إدارة التوفر" },
  viewCertifications: { en: "View Certifications", ar: "عرض الشهادات" },
  quickLinks: { en: "Quick Links", ar: "روابط سريعة" },
  loading: { en: "Loading profile...", ar: "جاري تحميل الملف..." },
  errorLoading: { en: "Failed to load profile", ar: "فشل في تحميل الملف الشخصي" },
};

const trainerStatusLabels: Record<string, { en: string; ar: string }> = {
  ACTIVE: { en: "Active", ar: "نشط" },
  INACTIVE: { en: "Inactive", ar: "غير نشط" },
  ON_LEAVE: { en: "On Leave", ar: "في إجازة" },
  TERMINATED: { en: "Terminated", ar: "منتهي" },
};

const trainerTypeLabels: Record<string, { en: string; ar: string }> = {
  PERSONAL_TRAINER: { en: "Personal Trainer", ar: "مدرب شخصي" },
  GROUP_FITNESS: { en: "Group Fitness", ar: "لياقة جماعية" },
  SPECIALIST: { en: "Specialist", ar: "متخصص" },
  HYBRID: { en: "Hybrid", ar: "هجين" },
};

function getStatusVariant(
  status: string
): "success" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "ON_LEAVE":
      return "secondary";
    case "INACTIVE":
      return "outline";
    case "TERMINATED":
      return "destructive";
    default:
      return "outline";
  }
}

export default function TrainerProfilePage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = (key: keyof typeof text) => (isAr ? text[key].ar : text[key].en);

  const { user } = useAuthStore();

  const { data: dashboard, isLoading, error } = useTrainerDashboard();

  const displayName = useMemo(() => {
    if (!user?.displayName) return "-";
    return isAr
      ? user.displayName.ar || user.displayName.en
      : user.displayName.en;
  }, [user, isAr]);

  const overview = dashboard?.overview;
  const clients = dashboard?.clients;
  const schedule = dashboard?.schedule;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("errorLoading")}
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusLabel = overview
    ? trainerStatusLabels[overview.trainerStatus]
    : null;
  const typeLabel = overview
    ? trainerTypeLabels[overview.trainerType]
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal info card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              {t("personalInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar and name */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xl font-bold">
                {displayName
                  .split(" ")
                  .map((n) => n.charAt(0))
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {overview?.trainerName || displayName}
                </p>
                {overview && (
                  <Badge
                    variant={getStatusVariant(overview.trainerStatus)}
                    className="mt-1"
                  >
                    {statusLabel
                      ? isAr
                        ? statusLabel.ar
                        : statusLabel.en
                      : overview.trainerStatus}
                  </Badge>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user?.email || "-"}</span>
              </div>
              {overview && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {typeLabel
                      ? isAr
                        ? typeLabel.ar
                        : typeLabel.en
                      : overview.trainerType}
                  </span>
                </div>
              )}
            </div>

            {/* Specializations */}
            <div className="pt-2">
              <p className="text-sm font-medium mb-2">
                {t("specializations")}
              </p>
              {overview?.specializations &&
              overview.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {overview.specializations.map((spec) => (
                    <Badge key={spec} variant="outline" className="text-xs">
                      <Dumbbell className="h-3 w-3 me-1" />
                      {spec}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("noSpecializations")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Overview stats card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              {t("overview")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {t("totalClients")}
                </p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {clients?.totalClients ?? 0}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {t("activeClients")}
                </p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {clients?.activeClients ?? 0}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg col-span-2">
                <p className="text-xs text-muted-foreground">
                  {t("sessionsCompleted")}
                </p>
                <p className="text-2xl font-bold font-display text-foreground">
                  {schedule?.completedThisMonth ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("quickLinks")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href={`/${locale}/trainer/availability`}>
                <Calendar className="h-4 w-4 me-2" />
                {t("manageAvailability")}
                <ArrowUpRight className="h-3 w-3 ms-1" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/trainer/certifications`}>
                <Award className="h-4 w-4 me-2" />
                {t("viewCertifications")}
                <ArrowUpRight className="h-3 w-3 ms-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
