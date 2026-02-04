"use client";

import { useLocale } from "next-intl";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@liyaqa/shared/components/ui/button";
import { MemberRegistrationWizard } from "@/components/forms/member-registration";

export default function NewMemberPage() {
  const locale = useLocale();

  const texts = {
    back: locale === "ar" ? "العودة للأعضاء" : "Back to Members",
    title: locale === "ar" ? "تسجيل عضو جديد" : "Register New Member",
    subtitle:
      locale === "ar"
        ? "أكمل جميع الخطوات لتسجيل عضو جديد"
        : "Complete all steps to register a new member",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/${locale}/members`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {texts.back}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.subtitle}</p>
        </div>
      </div>

      {/* Registration Wizard */}
      <MemberRegistrationWizard />
    </div>
  );
}
