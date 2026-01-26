"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, CheckCircle, FileText, Users } from "lucide-react";
import { PolicyStatusBadge } from "@/components/compliance/policy-status-badge";
import {
  usePolicy,
  usePolicyAcknowledgements,
  useSubmitForReview,
  useApprovePolicy,
  usePublishPolicy,
} from "@/queries/use-policies";
import { formatDate } from "@/lib/utils";

export default function PolicyDetailPage() {
  const locale = useLocale();
  const params = useParams();
  const policyId = params.id as string;
  const isArabic = locale === "ar";

  const { data: policy, isLoading: loadingPolicy } = usePolicy(policyId);
  const { data: acknowledgements, isLoading: loadingAcks } = usePolicyAcknowledgements(policyId);

  const submitForReview = useSubmitForReview();
  const approvePolicy = useApprovePolicy();
  const publishPolicy = usePublishPolicy();

  if (loadingPolicy) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {isArabic ? "السياسة غير موجودة" : "Policy not found"}
        </p>
      </div>
    );
  }

  const canSubmitForReview = policy.status === "DRAFT";
  const canApprove = policy.status === "UNDER_REVIEW";
  const canPublish = policy.status === "APPROVED";

  const policyTypeLabels: Record<string, { en: string; ar: string }> = {
    INFORMATION_SECURITY: { en: "Information Security", ar: "أمن المعلومات" },
    DATA_PROTECTION: { en: "Data Protection", ar: "حماية البيانات" },
    ACCESS_CONTROL: { en: "Access Control", ar: "التحكم في الوصول" },
    INCIDENT_RESPONSE: { en: "Incident Response", ar: "الاستجابة للحوادث" },
    BUSINESS_CONTINUITY: { en: "Business Continuity", ar: "استمرارية الأعمال" },
    ACCEPTABLE_USE: { en: "Acceptable Use", ar: "الاستخدام المقبول" },
    DATA_RETENTION: { en: "Data Retention", ar: "الاحتفاظ بالبيانات" },
    PRIVACY: { en: "Privacy", ar: "الخصوصية" },
    VENDOR_MANAGEMENT: { en: "Vendor Management", ar: "إدارة الموردين" },
    CHANGE_MANAGEMENT: { en: "Change Management", ar: "إدارة التغيير" },
    RISK_MANAGEMENT: { en: "Risk Management", ar: "إدارة المخاطر" },
    ASSET_MANAGEMENT: { en: "Asset Management", ar: "إدارة الأصول" },
    CRYPTOGRAPHY: { en: "Cryptography", ar: "التشفير" },
    PHYSICAL_SECURITY: { en: "Physical Security", ar: "الأمن المادي" },
    HR_SECURITY: { en: "HR Security", ar: "أمن الموارد البشرية" },
    NETWORK_SECURITY: { en: "Network Security", ar: "أمن الشبكات" },
    APPLICATION_SECURITY: { en: "Application Security", ar: "أمن التطبيقات" },
    MOBILE_DEVICE: { en: "Mobile Device", ar: "الأجهزة المحمولة" },
    REMOTE_WORK: { en: "Remote Work", ar: "العمل عن بعد" },
    SOCIAL_MEDIA: { en: "Social Media", ar: "وسائل التواصل الاجتماعي" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isArabic && policy.titleAr ? policy.titleAr : policy.title}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <PolicyStatusBadge status={policy.status} isArabic={isArabic} />
            <Badge variant="outline">v{policy.version}</Badge>
            <Badge variant="secondary">
              {isArabic
                ? policyTypeLabels[policy.policyType]?.ar
                : policyTypeLabels[policy.policyType]?.en}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {canSubmitForReview && (
            <Button
              variant="outline"
              onClick={() => submitForReview.mutate(policy.id)}
              disabled={submitForReview.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {isArabic ? "إرسال للمراجعة" : "Submit for Review"}
            </Button>
          )}
          {canApprove && (
            <Button
              variant="outline"
              onClick={() => approvePolicy.mutate(policy.id)}
              disabled={approvePolicy.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isArabic ? "اعتماد" : "Approve"}
            </Button>
          )}
          {canPublish && (
            <Button
              onClick={() => publishPolicy.mutate({ id: policy.id })}
              disabled={publishPolicy.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {isArabic ? "نشر" : "Publish"}
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "تاريخ السريان" : "Effective Date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {policy.effectiveDate
                ? formatDate(policy.effectiveDate, locale)
                : (isArabic ? "غير منشورة" : "Not published")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "المراجعة التالية" : "Next Review"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-medium ${policy.isReviewDue ? "text-red-600" : ""}`}>
              {policy.nextReviewDate
                ? formatDate(policy.nextReviewDate, locale)
                : "-"}
              {policy.isReviewDue && (
                <span className="text-sm block">
                  {isArabic ? "مستحق!" : "Due!"}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "يتطلب إقرار" : "Ack. Required"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={policy.acknowledgementRequired ? "default" : "outline"}>
              {policy.acknowledgementRequired
                ? (isArabic ? "نعم" : "Yes")
                : (isArabic ? "لا" : "No")}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "الإقرارات" : "Acknowledgements"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{acknowledgements?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">
            <FileText className="h-4 w-4 mr-2" />
            {isArabic ? "المحتوى" : "Content"}
          </TabsTrigger>
          <TabsTrigger value="acknowledgements">
            <Users className="h-4 w-4 mr-2" />
            {isArabic ? "الإقرارات" : "Acknowledgements"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {isArabic ? "محتوى السياسة (إنجليزي)" : "Policy Content (English)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                {policy.content ? (
                  <div className="whitespace-pre-wrap text-sm">{policy.content}</div>
                ) : (
                  <p className="text-muted-foreground italic">
                    {isArabic ? "لا يوجد محتوى" : "No content"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {policy.contentAr && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {isArabic ? "محتوى السياسة (عربي)" : "Policy Content (Arabic)"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none" dir="rtl">
                  <div className="whitespace-pre-wrap text-sm">{policy.contentAr}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="acknowledgements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? "سجل الإقرارات" : "Acknowledgement Log"}</CardTitle>
              <CardDescription>
                {isArabic
                  ? "الموظفون الذين أقروا بهذه السياسة"
                  : "Employees who have acknowledged this policy"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAcks ? (
                <Skeleton className="h-32" />
              ) : acknowledgements && acknowledgements.length > 0 ? (
                <div className="space-y-2">
                  {acknowledgements.map((ack) => (
                    <div
                      key={ack.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{ack.userId}</p>
                        <p className="text-sm text-muted-foreground">
                          {isArabic ? "الطريقة:" : "Method:"} {ack.method}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(ack.acknowledgedAt, locale)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {isArabic ? "لا توجد إقرارات بعد" : "No acknowledgements yet"}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
