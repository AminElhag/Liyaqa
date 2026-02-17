"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api";
import { useCreateScheduledReport } from "@liyaqa/shared/queries/use-reports";
import type { ReportType, ReportFrequency, ReportFormat } from "@liyaqa/shared/types/report";
import { toast } from "sonner";

const reportTypeLabels: Record<ReportType, { en: string; ar: string }> = {
  REVENUE: { en: "Revenue", ar: "الإيرادات" },
  ATTENDANCE: { en: "Attendance", ar: "الحضور" },
  MEMBERS: { en: "Members", ar: "الأعضاء" },
  CHURN: { en: "Churn", ar: "التسرب" },
  LTV: { en: "Lifetime Value", ar: "القيمة الدائمة" },
  RETENTION_COHORT: { en: "Retention Cohort", ar: "مجموعات الاحتفاظ" },
  SUBSCRIPTIONS: { en: "Subscriptions", ar: "الاشتراكات" },
  CLASSES: { en: "Classes", ar: "الحصص" },
  TRAINERS: { en: "Trainers", ar: "المدربين" },
};

const frequencyLabels: Record<ReportFrequency, { en: string; ar: string }> = {
  DAILY: { en: "Daily", ar: "يومي" },
  WEEKLY: { en: "Weekly", ar: "أسبوعي" },
  MONTHLY: { en: "Monthly", ar: "شهري" },
};

const formatLabels: Record<ReportFormat, { en: string; ar: string }> = {
  PDF: { en: "PDF", ar: "PDF" },
  EXCEL: { en: "Excel", ar: "Excel" },
  CSV: { en: "CSV", ar: "CSV" },
};

const REPORT_TYPES = Object.keys(reportTypeLabels) as ReportType[];
const FREQUENCIES = Object.keys(frequencyLabels) as ReportFrequency[];
const FORMATS = Object.keys(formatLabels) as ReportFormat[];

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  nameAr: z.string().optional(),
  reportType: z.enum(["REVENUE", "ATTENDANCE", "MEMBERS", "CHURN", "LTV", "RETENTION_COHORT", "SUBSCRIPTIONS", "CLASSES", "TRAINERS"] as const),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"] as const),
  recipients: z.string().min(1, "At least one recipient is required"),
  format: z.enum(["PDF", "EXCEL", "CSV"] as const).optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateScheduledReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateScheduledReportDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateScheduledReportDialogProps) {
  const locale = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createMutation = useCreateScheduledReport();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      nameAr: "",
      reportType: undefined,
      frequency: undefined,
      recipients: "",
      format: "PDF",
    },
  });

  const reportType = watch("reportType");
  const frequency = watch("frequency");
  const format = watch("format");

  const texts = {
    title: locale === "ar" ? "تقرير مجدول جديد" : "New Scheduled Report",
    description:
      locale === "ar"
        ? "إنشاء تقرير يتم إرساله تلقائياً بالبريد الإلكتروني"
        : "Create a report that is automatically sent via email",
    name: locale === "ar" ? "الاسم (إنجليزي)" : "Name",
    nameAr: locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)",
    reportType: locale === "ar" ? "نوع التقرير" : "Report Type",
    frequency: locale === "ar" ? "التكرار" : "Frequency",
    recipients: locale === "ar" ? "المستلمون" : "Recipients",
    recipientsHint:
      locale === "ar"
        ? "أدخل عناوين البريد الإلكتروني مفصولة بفواصل"
        : "Enter email addresses separated by commas",
    format: locale === "ar" ? "التنسيق" : "Format",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    create: locale === "ar" ? "إنشاء" : "Create",
    creating: locale === "ar" ? "جاري الإنشاء..." : "Creating...",
    selectPlaceholder: locale === "ar" ? "اختر..." : "Select...",
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const recipients = data.recipients
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      await createMutation.mutateAsync({
        name: data.name,
        nameAr: data.nameAr || undefined,
        reportType: data.reportType,
        frequency: data.frequency,
        recipients,
        format: data.format,
      });

      toast.success(
        locale === "ar"
          ? "تم إنشاء التقرير المجدول بنجاح"
          : "Scheduled report created successfully"
      );

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const apiError = await parseApiError(error);
      toast.error(getLocalizedErrorMessage(apiError, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="report-name">{texts.name}</Label>
            <Input
              id="report-name"
              placeholder={locale === "ar" ? "مثال: تقرير الإيرادات الأسبوعي" : "e.g. Weekly Revenue Report"}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Name AR */}
          <div className="space-y-2">
            <Label htmlFor="report-name-ar">{texts.nameAr}</Label>
            <Input
              id="report-name-ar"
              placeholder={locale === "ar" ? "الاسم بالعربي (اختياري)" : "Arabic name (optional)"}
              dir="rtl"
              {...register("nameAr")}
            />
          </div>

          {/* Report Type */}
          <div className="space-y-2">
            <Label>{texts.reportType}</Label>
            <Select
              value={reportType}
              onValueChange={(v) => setValue("reportType", v as ReportType, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={texts.selectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {locale === "ar" ? reportTypeLabels[type].ar : reportTypeLabels[type].en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reportType && (
              <p className="text-sm text-destructive">{errors.reportType.message}</p>
            )}
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>{texts.frequency}</Label>
            <Select
              value={frequency}
              onValueChange={(v) => setValue("frequency", v as ReportFrequency, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={texts.selectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((freq) => (
                  <SelectItem key={freq} value={freq}>
                    {locale === "ar" ? frequencyLabels[freq].ar : frequencyLabels[freq].en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.frequency && (
              <p className="text-sm text-destructive">{errors.frequency.message}</p>
            )}
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label htmlFor="report-recipients">{texts.recipients}</Label>
            <Input
              id="report-recipients"
              placeholder="admin@club.com, manager@club.com"
              {...register("recipients")}
            />
            <p className="text-xs text-muted-foreground">{texts.recipientsHint}</p>
            {errors.recipients && (
              <p className="text-sm text-destructive">{errors.recipients.message}</p>
            )}
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label>{texts.format}</Label>
            <Select
              value={format}
              onValueChange={(v) => setValue("format", v as ReportFormat, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={texts.selectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((fmt) => (
                  <SelectItem key={fmt} value={fmt}>
                    {locale === "ar" ? formatLabels[fmt].ar : formatLabels[fmt].en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              {texts.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {texts.creating}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 me-2" />
                  {texts.create}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
