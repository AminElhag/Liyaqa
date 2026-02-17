"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Edit,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Circle,
  Download,
  FileDown,
  Clock,
  AlertTriangle,
  XCircle,
  History,
  Loader2,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@liyaqa/shared/components/ui/tabs";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Progress } from "@liyaqa/shared/components/ui/progress";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useTenantById,
  useOnboardingChecklist,
  useCompleteOnboardingStep,
  useDataExports,
  useRequestDataExport,
  useDeactivationHistory,
} from "@liyaqa/shared/queries/platform/use-tenants";
import { formatDate } from "@liyaqa/shared/utils";
import {
  TENANT_STATUS_CONFIG,
} from "@liyaqa/shared/types/platform/tenant";

export default function TenantDetailPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const tenantId = params.id as string;

  // Data fetching
  const { data: tenant, isLoading, error } = useTenantById(tenantId);
  const { data: onboarding, isLoading: onboardingLoading } = useOnboardingChecklist(tenantId);
  const { data: exports, isLoading: exportsLoading } = useDataExports(tenantId);
  const { data: deactivationHistory, isLoading: historyLoading } = useDeactivationHistory(tenantId);

  // Mutations
  const completeStep = useCompleteOnboardingStep();
  const requestExport = useRequestDataExport();

  const texts = {
    back: locale === "ar" ? "العودة للمستأجرين" : "Back to Tenants",
    edit: locale === "ar" ? "تعديل" : "Edit",
    overview: locale === "ar" ? "نظرة عامة" : "Overview",
    onboarding: locale === "ar" ? "الإعداد" : "Onboarding",
    dataExports: locale === "ar" ? "تصدير البيانات" : "Data Exports",
    history: locale === "ar" ? "السجل" : "History",
    tenantInfo: locale === "ar" ? "معلومات المستأجر" : "Tenant Information",
    contactInfo: locale === "ar" ? "معلومات الاتصال" : "Contact Information",
    subdomain: locale === "ar" ? "النطاق الفرعي" : "Subdomain",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    address: locale === "ar" ? "العنوان" : "Address",
    city: locale === "ar" ? "المدينة" : "City",
    region: locale === "ar" ? "المنطقة" : "Region",
    country: locale === "ar" ? "الدولة" : "Country",
    crNumber: locale === "ar" ? "رقم السجل التجاري" : "CR Number",
    vatNumber: locale === "ar" ? "الرقم الضريبي" : "VAT Number",
    status: locale === "ar" ? "الحالة" : "Status",
    createdAt: locale === "ar" ? "تاريخ الإنشاء" : "Created",
    updatedAt: locale === "ar" ? "تاريخ التحديث" : "Updated",
    na: locale === "ar" ? "غير محدد" : "N/A",
    errorMsg: locale === "ar" ? "حدث خطأ أثناء تحميل المستأجر" : "Error loading tenant",
    notFound: locale === "ar" ? "المستأجر غير موجود" : "Tenant not found",
    onboardingProgress: locale === "ar" ? "تقدم الإعداد" : "Onboarding Progress",
    stepsCompleted: locale === "ar" ? "خطوة مكتملة" : "steps completed",
    markComplete: locale === "ar" ? "إكمال" : "Mark Complete",
    completedAt: locale === "ar" ? "اكتمل في" : "Completed",
    noOnboardingData: locale === "ar" ? "لا توجد بيانات إعداد" : "No onboarding data available",
    requestExport: locale === "ar" ? "طلب تصدير" : "Request Export",
    exportRequested: locale === "ar" ? "تم طلب التصدير" : "Export Requested",
    exportRequestedDesc:
      locale === "ar"
        ? "تم إنشاء طلب تصدير البيانات بنجاح"
        : "Data export request created successfully",
    noExports: locale === "ar" ? "لا توجد عمليات تصدير" : "No exports yet",
    noExportsDesc:
      locale === "ar"
        ? "لم يتم طلب أي عمليات تصدير بيانات لهذا المستأجر"
        : "No data exports have been requested for this tenant",
    downloadExport: locale === "ar" ? "تحميل" : "Download",
    deactivationHistory: locale === "ar" ? "سجل الإيقاف" : "Deactivation History",
    noHistory: locale === "ar" ? "لا يوجد سجل" : "No history",
    noHistoryDesc:
      locale === "ar"
        ? "لم يتم إيقاف هذا المستأجر من قبل"
        : "This tenant has never been deactivated",
    reason: locale === "ar" ? "السبب" : "Reason",
    deactivatedBy: locale === "ar" ? "أوقف بواسطة" : "Deactivated By",
    deactivatedAt: locale === "ar" ? "تاريخ الإيقاف" : "Deactivated At",
    previousStatus: locale === "ar" ? "الحالة السابقة" : "Previous Status",
    of: locale === "ar" ? "من" : "of",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    stepCompleted: locale === "ar" ? "تم إكمال الخطوة" : "Step Completed",
    stepCompletedDesc:
      locale === "ar"
        ? "تم تحديث قائمة الإعداد"
        : "Onboarding checklist updated",
  };

  const exportStatusConfig: Record<string, { labelEn: string; labelAr: string; icon: typeof Clock }> = {
    PENDING: { labelEn: "Pending", labelAr: "قيد الانتظار", icon: Clock },
    IN_PROGRESS: { labelEn: "In Progress", labelAr: "جاري التنفيذ", icon: Loader2 },
    COMPLETED: { labelEn: "Completed", labelAr: "مكتمل", icon: CheckCircle2 },
    FAILED: { labelEn: "Failed", labelAr: "فشل", icon: XCircle },
  };

  const handleCompleteStep = (step: string) => {
    completeStep.mutate(
      { tenantId, step },
      {
        onSuccess: () => {
          toast({
            title: texts.stepCompleted,
            description: texts.stepCompletedDesc,
          });
        },
        onError: (err) => {
          toast({
            title: texts.errorTitle,
            description: err.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleRequestExport = () => {
    requestExport.mutate(tenantId, {
      onSuccess: () => {
        toast({
          title: texts.exportRequested,
          description: texts.exportRequestedDesc,
        });
      },
      onError: (err) => {
        toast({
          title: texts.errorTitle,
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.errorMsg : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  const statusConfig = TENANT_STATUS_CONFIG[tenant.status] ?? {
    labelEn: tenant.status,
    labelAr: tenant.status,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/tenants`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {tenant.facilityName}
                </h1>
                <Badge
                  variant="secondary"
                  className={`${statusConfig.color} ${statusConfig.bgColor} border-0`}
                >
                  {locale === "ar" ? statusConfig.labelAr : statusConfig.labelEn}
                </Badge>
              </div>
              {tenant.subdomain && (
                <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="font-mono text-sm">{tenant.subdomain}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <Button asChild>
          <Link href={`/${locale}/tenants/${tenantId}/edit`}>
            <Edit className="me-2 h-4 w-4" />
            {texts.edit}
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">{texts.overview}</TabsTrigger>
          <TabsTrigger value="onboarding">{texts.onboarding}</TabsTrigger>
          <TabsTrigger value="exports">{texts.dataExports}</TabsTrigger>
          <TabsTrigger value="history">
            <History className="me-1 h-4 w-4" />
            {texts.history}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Tenant Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {texts.tenantInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{texts.status}</span>
                  <Badge
                    variant="secondary"
                    className={`${statusConfig.color} ${statusConfig.bgColor} border-0`}
                  >
                    {locale === "ar" ? statusConfig.labelAr : statusConfig.labelEn}
                  </Badge>
                </div>
                {tenant.subdomain && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{texts.subdomain}</span>
                    <span className="font-mono text-sm">{tenant.subdomain}</span>
                  </div>
                )}
                {tenant.crNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{texts.crNumber}</span>
                    <span className="font-mono text-sm">{tenant.crNumber}</span>
                  </div>
                )}
                {tenant.vatNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{texts.vatNumber}</span>
                    <span className="font-mono text-sm">{tenant.vatNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{texts.country}</span>
                  <span className="font-medium">{tenant.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{texts.createdAt}</span>
                  <span className="font-medium">{formatDate(tenant.createdAt, locale)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {texts.contactInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{tenant.contactEmail}</span>
                </div>
                {tenant.contactPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{tenant.contactPhone}</span>
                  </div>
                )}
                {tenant.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{tenant.address}</span>
                  </div>
                )}
                {tenant.city && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{texts.city}</span>
                    <span>{tenant.city}</span>
                  </div>
                )}
                {tenant.region && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{texts.region}</span>
                    <span>{tenant.region}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{texts.onboardingProgress}</CardTitle>
              {onboarding && (
                <CardDescription>
                  {onboarding.completedSteps} {texts.of} {onboarding.totalSteps} {texts.stepsCompleted}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {onboardingLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loading />
                </div>
              ) : onboarding ? (
                <div className="space-y-6">
                  <Progress value={onboarding.percentage} className="h-3" />

                  <div className="space-y-3">
                    {onboarding.items.map((item) => (
                      <div
                        key={item.step}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-3">
                          {item.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className={item.completed ? "line-through text-muted-foreground" : "font-medium"}>
                              {item.step}
                            </p>
                            {item.completedAt && (
                              <p className="text-xs text-muted-foreground">
                                {texts.completedAt}: {formatDate(item.completedAt, locale)}
                              </p>
                            )}
                          </div>
                        </div>
                        {!item.completed && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={completeStep.isPending}
                            onClick={() => handleCompleteStep(item.step)}
                          >
                            {completeStep.isPending ? (
                              <Loader2 className="me-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="me-2 h-4 w-4" />
                            )}
                            {texts.markComplete}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  {texts.noOnboardingData}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Exports Tab */}
        <TabsContent value="exports" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{texts.dataExports}</h3>
            <Button
              onClick={handleRequestExport}
              disabled={requestExport.isPending}
            >
              {requestExport.isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="me-2 h-4 w-4" />
              )}
              {texts.requestExport}
            </Button>
          </div>

          {exportsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loading />
            </div>
          ) : exports && exports.length > 0 ? (
            <div className="space-y-3">
              {exports.map((exportJob) => {
                const statusInfo = exportStatusConfig[exportJob.status];
                const StatusIcon = statusInfo?.icon || Clock;
                return (
                  <Card key={exportJob.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <StatusIcon className={`h-5 w-5 ${
                              exportJob.status === "COMPLETED"
                                ? "text-green-600"
                                : exportJob.status === "FAILED"
                                ? "text-red-600"
                                : exportJob.status === "IN_PROGRESS"
                                ? "text-blue-600 animate-spin"
                                : "text-muted-foreground"
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {locale === "ar"
                                  ? statusInfo?.labelAr
                                  : statusInfo?.labelEn}
                              </Badge>
                              {exportJob.fileSizeBytes && (
                                <span className="text-sm text-muted-foreground">
                                  {(exportJob.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              <span>{formatDate(exportJob.createdAt, locale)}</span>
                            </div>
                          </div>
                        </div>
                        {exportJob.status === "COMPLETED" && exportJob.fileUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={exportJob.fileUrl} download>
                              <Download className="me-2 h-4 w-4" />
                              {texts.downloadExport}
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <FileDown className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">{texts.noExports}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{texts.noExportsDesc}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {texts.deactivationHistory}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loading />
                </div>
              ) : deactivationHistory && deactivationHistory.length > 0 ? (
                <div className="space-y-4">
                  {deactivationHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg border p-4 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="font-medium">{texts.reason}</p>
                            <p className="text-sm text-muted-foreground">{entry.reason}</p>
                            {entry.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                            )}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 text-sm">
                            <div className="flex justify-between p-2 bg-muted/50 rounded">
                              <span className="text-muted-foreground">{texts.deactivatedBy}</span>
                              <span className="font-medium font-mono text-xs">{entry.deactivatedBy}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-muted/50 rounded">
                              <span className="text-muted-foreground">{texts.deactivatedAt}</span>
                              <span className="font-medium">
                                {formatDate(entry.createdAt, locale)}
                              </span>
                            </div>
                            <div className="flex justify-between p-2 bg-muted/50 rounded">
                              <span className="text-muted-foreground">{texts.previousStatus}</span>
                              <span className="font-medium">{entry.previousStatus}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <History className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">{texts.noHistory}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{texts.noHistoryDesc}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
