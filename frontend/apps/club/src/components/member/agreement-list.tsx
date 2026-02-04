"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import {
  FileText,
  Shield,
  Heart,
  Lock,
  Camera,
  Megaphone,
  Scale,
  File,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { cn } from "@liyaqa/shared/utils";
import type { Agreement, MemberAgreement, AgreementType } from "@liyaqa/shared/types/agreement";

const AGREEMENT_ICONS: Record<AgreementType, React.ComponentType<{ className?: string }>> = {
  LIABILITY_WAIVER: Shield,
  TERMS_CONDITIONS: FileText,
  HEALTH_DISCLOSURE: Heart,
  PRIVACY_POLICY: Lock,
  PHOTO_CONSENT: Camera,
  MARKETING_CONSENT: Megaphone,
  RULES_REGULATIONS: Scale,
  CUSTOM: File,
};

const AGREEMENT_TYPE_LABELS: Record<AgreementType, { en: string; ar: string }> = {
  LIABILITY_WAIVER: { en: "Liability Waiver", ar: "إخلاء المسؤولية" },
  TERMS_CONDITIONS: { en: "Terms & Conditions", ar: "الشروط والأحكام" },
  HEALTH_DISCLOSURE: { en: "Health Disclosure", ar: "الإفصاح الصحي" },
  PRIVACY_POLICY: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  PHOTO_CONSENT: { en: "Photo Consent", ar: "موافقة التصوير" },
  MARKETING_CONSENT: { en: "Marketing Consent", ar: "موافقة التسويق" },
  RULES_REGULATIONS: { en: "Rules & Regulations", ar: "القواعد واللوائح" },
  CUSTOM: { en: "Agreement", ar: "اتفاقية" },
};

interface AgreementListProps {
  pendingAgreements: Agreement[];
  signedAgreements: MemberAgreement[];
  isLoading?: boolean;
  className?: string;
}

export function AgreementList({
  pendingAgreements,
  signedAgreements,
  isLoading,
  className,
}: AgreementListProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const hasPending = pendingAgreements.length > 0;
  const hasSigned = signedAgreements.length > 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Pending Agreements Section */}
      {hasPending && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-lg">
              {isArabic ? "اتفاقيات تحتاج توقيعك" : "Agreements Requiring Signature"}
            </h3>
            <Badge variant="destructive" className="ms-auto">
              {pendingAgreements.length}
            </Badge>
          </div>

          <div className="space-y-2">
            {pendingAgreements.map((agreement) => {
              const Icon = AGREEMENT_ICONS[agreement.type] || File;
              const typeLabel = AGREEMENT_TYPE_LABELS[agreement.type];
              const title = isArabic
                ? agreement.title?.ar || agreement.title?.en
                : agreement.title?.en;

              return (
                <Link
                  key={agreement.id}
                  href={`/member/agreements/${agreement.id}`}
                >
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{title}</p>
                          <p className="text-sm text-muted-foreground">
                            {isArabic ? typeLabel?.ar : typeLabel?.en}
                            {agreement.isMandatory && (
                              <Badge variant="outline" className="ms-2 text-xs">
                                {isArabic ? "إلزامي" : "Required"}
                              </Badge>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-amber-600">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm hidden sm:inline">
                            {isArabic ? "بانتظار التوقيع" : "Awaiting"}
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Signed Agreements Section */}
      {hasSigned && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-lg">
              {isArabic ? "الاتفاقيات الموقعة" : "Signed Agreements"}
            </h3>
            <Badge variant="secondary" className="ms-auto">
              {signedAgreements.length}
            </Badge>
          </div>

          <div className="space-y-2">
            {signedAgreements.map((memberAgreement) => {
              // Note: In a real app, we'd have agreement details populated
              return (
                <Card key={memberAgreement.id} className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-green-50 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {isArabic ? "اتفاقية موقعة" : "Signed Agreement"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {isArabic ? "تم التوقيع في" : "Signed on"}{" "}
                          {formatDate(memberAgreement.signedAt)}
                          <span className="ms-2 text-xs">
                            (v{memberAgreement.agreementVersion})
                          </span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasPending && !hasSigned && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-center">
              {isArabic
                ? "لا توجد اتفاقيات حالياً"
                : "No agreements available"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
