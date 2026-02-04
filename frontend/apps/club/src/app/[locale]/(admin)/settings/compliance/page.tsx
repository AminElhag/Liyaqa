"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  Shield,
  FileText,
  AlertTriangle,
  Lock,
  ClipboardCheck,
  Activity,
  AlertCircle,
  Clock,
} from "lucide-react";
import { ComplianceScoreCard } from "@/components/compliance/compliance-score-card";
import {
  useComplianceFrameworks,
  useOrganizationComplianceStatus,
} from "@liyaqa/shared/queries/use-compliance";
import { useOverdueDSRs, useBreachStats } from "@liyaqa/shared/queries/use-data-protection";
import { usePoliciesDueForReview } from "@liyaqa/shared/queries/use-policies";
import { useUninvestigatedEvents } from "@liyaqa/shared/queries/use-security-events";

export default function ComplianceDashboardPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const { data: frameworks, isLoading: loadingFrameworks } = useComplianceFrameworks({ active: true });
  const { data: statuses, isLoading: loadingStatuses } = useOrganizationComplianceStatus();
  const { data: overdueDSRs, isLoading: loadingDSRs } = useOverdueDSRs();
  const { data: breachStats, isLoading: loadingBreaches } = useBreachStats();
  const { data: policiesDue, isLoading: loadingPolicies } = usePoliciesDueForReview();
  const { data: uninvestigated, isLoading: loadingEvents } = useUninvestigatedEvents();

  const isLoading = loadingFrameworks || loadingStatuses;

  const getStatusByFramework = (frameworkId: string) => {
    return statuses?.find((s) => s.frameworkId === frameworkId);
  };

  const keyFrameworks = ["ISO27001", "SOC2", "PCI_DSS", "PDPL"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isArabic ? "الامتثال والأمان" : "Compliance & Security"}
        </h1>
        <p className="text-muted-foreground">
          {isArabic
            ? "إدارة الامتثال التنظيمي وأمن المعلومات وحماية البيانات"
            : "Manage regulatory compliance, information security, and data protection"}
        </p>
      </div>

      {/* Framework Compliance Scores */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {isArabic ? "نتائج الامتثال" : "Compliance Scores"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))
          ) : (
            frameworks
              ?.filter((f) => keyFrameworks.includes(f.code))
              .map((framework) => {
                const status = getStatusByFramework(framework.id);
                return (
                  <ComplianceScoreCard
                    key={framework.id}
                    title={isArabic && framework.nameAr ? framework.nameAr : framework.name}
                    description={framework.code}
                    score={status?.complianceScore ?? 0}
                    isArabic={isArabic}
                  />
                );
              })
          )}
        </div>
      </div>

      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            {isArabic ? "تنبيهات" : "Alerts"}
          </CardTitle>
          <CardDescription>
            {isArabic ? "العناصر التي تحتاج إلى اهتمام" : "Items requiring attention"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {loadingDSRs ? (
              <Skeleton className="h-16" />
            ) : (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Clock className="h-8 w-8 text-red-500" />
                <div>
                  <p className="font-medium text-2xl">{overdueDSRs?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? "طلبات DSR متأخرة" : "Overdue DSRs"}
                  </p>
                </div>
              </div>
            )}

            {loadingBreaches ? (
              <Skeleton className="h-16" />
            ) : (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="font-medium text-2xl">{breachStats?.openBreaches ?? 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? "انتهاكات مفتوحة" : "Open Breaches"}
                  </p>
                </div>
              </div>
            )}

            {loadingPolicies ? (
              <Skeleton className="h-16" />
            ) : (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium text-2xl">{policiesDue?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? "سياسات تحتاج مراجعة" : "Policies Due for Review"}
                  </p>
                </div>
              </div>
            )}

            {loadingEvents ? (
              <Skeleton className="h-16" />
            ) : (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Activity className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="font-medium text-2xl">{uninvestigated?.content?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? "أحداث غير محققة" : "Uninvestigated Events"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/settings/compliance/frameworks">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {isArabic ? "أطر الامتثال" : "Compliance Frameworks"}
                </CardTitle>
              </div>
              <CardDescription>
                {isArabic
                  ? "إدارة ISO 27001، SOC 2، PCI DSS، PDPL"
                  : "Manage ISO 27001, SOC 2, PCI DSS, PDPL"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/settings/compliance/evidence">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {isArabic ? "الأدلة" : "Evidence"}
                </CardTitle>
              </div>
              <CardDescription>
                {isArabic
                  ? "رفع وإدارة أدلة الامتثال"
                  : "Upload and manage compliance evidence"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/settings/compliance/risks">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {isArabic ? "تقييم المخاطر" : "Risk Assessments"}
                </CardTitle>
              </div>
              <CardDescription>
                {isArabic
                  ? "تحديد وتقييم ومعالجة المخاطر"
                  : "Identify, assess, and treat risks"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/settings/compliance/data-protection">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {isArabic ? "حماية البيانات" : "Data Protection"}
                </CardTitle>
              </div>
              <CardDescription>
                {isArabic
                  ? "امتثال PDPL، طلبات أصحاب البيانات، الانتهاكات"
                  : "PDPL compliance, DSRs, breaches"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/settings/compliance/policies">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {isArabic ? "السياسات" : "Policies"}
                </CardTitle>
              </div>
              <CardDescription>
                {isArabic
                  ? "إدارة سياسات أمن المعلومات"
                  : "Manage information security policies"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/settings/compliance/security-events">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {isArabic ? "سجل الأحداث الأمنية" : "Security Events"}
                </CardTitle>
              </div>
              <CardDescription>
                {isArabic
                  ? "مراقبة وتحقيق الأحداث الأمنية"
                  : "Monitor and investigate security events"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* SDAIA Notification Status */}
      {breachStats && breachStats.sdaiaPendingNotification > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              {isArabic ? "إشعار سدايا مطلوب" : "SDAIA Notification Required"}
            </CardTitle>
            <CardDescription className="text-red-700">
              {isArabic
                ? `${breachStats.sdaiaPendingNotification} انتهاك(ات) تتطلب إشعار سدايا خلال 72 ساعة (المادة 29 من PDPL)`
                : `${breachStats.sdaiaPendingNotification} breach(es) require SDAIA notification within 72 hours (PDPL Article 29)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/compliance/data-protection/breaches">
              <Badge className="bg-red-600 hover:bg-red-700 cursor-pointer">
                {isArabic ? "عرض الانتهاكات" : "View Breaches"}
              </Badge>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
