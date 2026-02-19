"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Award,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
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
import { useTrainerCertifications } from "@liyaqa/shared/queries/use-trainer-portal";
import { cn, formatDate } from "@liyaqa/shared/utils";
import type { CertificationStatus } from "@liyaqa/shared/types/trainer-portal";

const text = {
  title: { en: "Certifications", ar: "الشهادات" },
  subtitle: { en: "Your professional certifications and credentials", ar: "شهاداتك المهنية واعتماداتك" },
  noCertifications: { en: "No certifications found", ar: "لا توجد شهادات" },
  noCertificationsDesc: {
    en: "Your certifications will appear here once added by the admin.",
    ar: "ستظهر شهاداتك هنا بمجرد إضافتها من قبل المسؤول.",
  },
  issuingOrg: { en: "Issuing Organization", ar: "المنظمة المصدرة" },
  issuedDate: { en: "Issued", ar: "تاريخ الإصدار" },
  expiryDate: { en: "Expires", ar: "تاريخ الانتهاء" },
  certNumber: { en: "Certificate #", ar: "رقم الشهادة" },
  verified: { en: "Verified", ar: "موثقة" },
  notVerified: { en: "Not Verified", ar: "غير موثقة" },
  previous: { en: "Previous", ar: "السابق" },
  next: { en: "Next", ar: "التالي" },
};

const statusConfig: Record<
  CertificationStatus,
  { en: string; ar: string; variant: "success" | "secondary" | "destructive"; icon: typeof CheckCircle2 }
> = {
  ACTIVE: { en: "Active", ar: "نشطة", variant: "success", icon: CheckCircle2 },
  EXPIRED: { en: "Expired", ar: "منتهية", variant: "destructive", icon: AlertTriangle },
  PENDING_VERIFICATION: {
    en: "Pending Verification",
    ar: "قيد التحقق",
    variant: "secondary",
    icon: Clock,
  },
};

export default function TrainerCertificationsPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = (key: keyof typeof text) => (isAr ? text[key].ar : text[key].en);

  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useTrainerCertifications({
    page,
    size: 12,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32 mt-2" />
                <Skeleton className="h-4 w-24 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {isAr ? "فشل في تحميل الشهادات" : "Failed to load certifications"}
          </CardContent>
        </Card>
      )}

      {/* Certifications list */}
      {!isLoading && !error && (
        <>
          {!data?.content || data.content.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">{t("noCertifications")}</p>
                <p className="text-sm mt-1">{t("noCertificationsDesc")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.content.map((cert) => {
                const statusCfg = statusConfig[cert.status];
                const StatusIcon = statusCfg.icon;
                const certName = isAr ? cert.nameAr : cert.nameEn;

                return (
                  <Card
                    key={cert.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <Award className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <CardTitle className="text-base">
                              {certName}
                            </CardTitle>
                          </div>
                        </div>
                        <Badge variant={statusCfg.variant} className="text-xs shrink-0">
                          <StatusIcon className="h-3 w-3 me-1" />
                          {isAr ? statusCfg.ar : statusCfg.en}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{cert.issuingOrganization}</span>
                      </div>

                      {cert.issuedDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {t("issuedDate")}:{" "}
                            {formatDate(cert.issuedDate, locale)}
                          </span>
                        </div>
                      )}

                      {cert.expiryDate && (
                        <div
                          className={cn(
                            "flex items-center gap-2 text-sm",
                            cert.status === "EXPIRED"
                              ? "text-destructive"
                              : "text-muted-foreground"
                          )}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {t("expiryDate")}:{" "}
                            {formatDate(cert.expiryDate, locale)}
                          </span>
                        </div>
                      )}

                      {cert.certificateNumber && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          <span>
                            {t("certNumber")}: {cert.certificateNumber}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 pt-2 border-t">
                        {cert.isVerified ? (
                          <Badge
                            variant="outline"
                            className="text-xs text-green-600 border-green-200 bg-green-50 dark:bg-green-950/20"
                          >
                            <Shield className="h-3 w-3 me-1" />
                            {t("verified")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {t("notVerified")}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                {t("previous")}
              </Button>
              <span className="flex items-center px-4 text-sm">
                {page + 1} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
              >
                {t("next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
