"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { EnrollmentWizard } from "@/components/enrollment";

export default function EnrollPage() {
  const locale = useLocale();

  const texts = {
    back: locale === "ar" ? "العودة" : "Back",
    title: locale === "ar" ? "تسجيل عضو جديد" : "Enroll New Member",
    subtitle: locale === "ar"
      ? "أكمل جميع الخطوات لتسجيل عضو جديد في النادي"
      : "Complete all steps to enroll a new member in the club",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/members`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {texts.back}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-sm text-muted-foreground">{texts.subtitle}</p>
        </div>
      </div>

      <EnrollmentWizard />
    </div>
  );
}
