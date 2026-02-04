"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowLeft, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@liyaqa/shared/utils";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  Card,
  CardContent,
} from "@liyaqa/shared/components/ui/card";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useClass, useGenerateSessions } from "@liyaqa/shared/queries";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api";
import { BulkSessionGenerator } from "@/components/admin/bulk-session-generator";

const texts = {
  en: {
    back: "Back to Class",
    title: "Generate Sessions",
    subtitle: "Create sessions automatically from your weekly schedule",
    successTitle: "Sessions Generated!",
    successMessage: (count: number) =>
      `Successfully created ${count} sessions for this class.`,
    viewSessions: "View All Sessions",
    generateMore: "Generate More",
    backToClass: "Back to Class",
  },
  ar: {
    back: "العودة للفصل",
    title: "إنشاء الجلسات",
    subtitle: "إنشاء جلسات تلقائيا من جدولك الأسبوعي",
    successTitle: "تم إنشاء الجلسات!",
    successMessage: (count: number) =>
      `تم إنشاء ${count} جلسة لهذا الفصل بنجاح.`,
    viewSessions: "عرض جميع الجلسات",
    generateMore: "إنشاء المزيد",
    backToClass: "العودة للفصل",
  },
};

export default function GenerateSessionsPage() {
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const t = texts[locale];
  const isRTL = locale === "ar";

  const [error, setError] = useState<string | null>(null);
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);

  const { data: gymClass, isLoading } = useClass(id);
  const generateSessions = useGenerateSessions();

  const handleGenerate = async (startDate: string, endDate: string) => {
    setError(null);
    setGeneratedCount(null);
    try {
      const sessions = await generateSessions.mutateAsync({
        classId: id,
        data: {
          startDate,
          endDate,
        },
      });
      setGeneratedCount(sessions.length);
    } catch (err) {
      const apiError = await parseApiError(err);
      setError(getLocalizedErrorMessage(apiError, locale));
    }
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  // Success state
  if (generatedCount !== null) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Link
          href={`/${locale}/classes/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackArrow className="h-4 w-4" />
          {t.back}
        </Link>

        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t.successTitle}</h2>
            <p className="text-emerald-100">
              {t.successMessage(generatedCount)}
            </p>
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setGeneratedCount(null)}
                className="flex-1"
              >
                <Sparkles className="me-2 h-4 w-4" />
                {t.generateMore}
              </Button>
              <Button asChild className="flex-1">
                <Link href={`/${locale}/sessions`}>{t.viewSessions}</Link>
              </Button>
            </div>
            <Button
              variant="ghost"
              asChild
              className="w-full mt-3"
            >
              <Link href={`/${locale}/classes/${id}`}>{t.backToClass}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={`/${locale}/classes/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackArrow className="h-4 w-4" />
          {t.back}
        </Link>

        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              "bg-gradient-to-br from-violet-100 to-sky-100",
              "dark:from-violet-900/40 dark:to-sky-900/40"
            )}
          >
            <Sparkles className="h-7 w-7 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            {gymClass && (
              <p className="text-muted-foreground">
                <LocalizedText text={gymClass.name} />
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Bulk Session Generator */}
      <BulkSessionGenerator
        schedules={gymClass?.schedules ?? []}
        onGenerate={handleGenerate}
        isGenerating={generateSessions.isPending}
      />
    </div>
  );
}
