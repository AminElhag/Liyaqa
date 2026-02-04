"use client";

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
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { ScrollArea } from "@liyaqa/shared/components/ui/scroll-area";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { cn } from "@liyaqa/shared/utils";
import type { Agreement, AgreementType } from "@liyaqa/shared/types/agreement";

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

interface AgreementViewerProps {
  agreement: Agreement | null | undefined;
  isLoading?: boolean;
  showSignatureSection?: boolean;
  className?: string;
  children?: React.ReactNode; // For signature pad slot
}

export function AgreementViewer({
  agreement,
  isLoading,
  showSignatureSection = true,
  className,
  children,
}: AgreementViewerProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!agreement) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-center">
            {isArabic
              ? "لم يتم العثور على الاتفاقية"
              : "Agreement not found"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const Icon = AGREEMENT_ICONS[agreement.type] || File;
  const typeLabel = AGREEMENT_TYPE_LABELS[agreement.type];
  const title = isArabic
    ? agreement.title?.ar || agreement.title?.en
    : agreement.title?.en;
  const content = isArabic
    ? agreement.content?.ar || agreement.content?.en
    : agreement.content?.en;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline">
                  {isArabic ? typeLabel?.ar : typeLabel?.en}
                </Badge>
                {agreement.isMandatory && (
                  <Badge variant="destructive">
                    {isArabic ? "إلزامي" : "Required"}
                  </Badge>
                )}
                <span className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  v{agreement.agreementVersion} - {formatDate(agreement.effectiveDate)}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {isArabic ? "محتوى الاتفاقية" : "Agreement Content"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div
              className={cn(
                "prose prose-sm max-w-none",
                isArabic && "prose-ar text-right",
                "prose-headings:font-semibold prose-headings:text-foreground",
                "prose-p:text-muted-foreground prose-p:leading-relaxed",
                "prose-li:text-muted-foreground"
              )}
              dir={isArabic ? "rtl" : "ltr"}
            >
              {/* Render content - assuming it's plain text or simple HTML */}
              {content?.split("\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Health Questions Notice */}
      {agreement.hasHealthQuestions && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 py-4">
            <Heart className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">
                {isArabic
                  ? "هذه الاتفاقية تتطلب معلومات صحية"
                  : "This agreement requires health information"}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {isArabic
                  ? "سيُطلب منك تقديم معلومات صحية قبل التوقيع"
                  : "You will be asked to provide health information before signing"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signature Section */}
      {showSignatureSection && children && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              {isArabic ? "التوقيع الإلكتروني" : "Electronic Signature"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isArabic
                ? "بالتوقيع أدناه، أقر بأنني قرأت وفهمت ووافقت على شروط هذه الاتفاقية."
                : "By signing below, I acknowledge that I have read, understood, and agree to the terms of this agreement."}
            </p>
            {children}
          </div>
        </>
      )}
    </div>
  );
}
