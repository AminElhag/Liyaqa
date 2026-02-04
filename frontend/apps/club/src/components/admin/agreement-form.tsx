"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@liyaqa/shared/components/ui/card";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@liyaqa/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@liyaqa/shared/components/ui/popover";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@liyaqa/shared/utils";
import type { Agreement, AgreementType, CreateAgreementRequest, UpdateAgreementRequest } from "@liyaqa/shared/types/agreement";
import { TYPE_LABELS } from "./agreement-columns";

const AGREEMENT_TYPES: AgreementType[] = [
  "LIABILITY_WAIVER",
  "TERMS_CONDITIONS",
  "HEALTH_DISCLOSURE",
  "PRIVACY_POLICY",
  "PHOTO_CONSENT",
  "MARKETING_CONSENT",
  "RULES_REGULATIONS",
  "CUSTOM",
];

const agreementSchema = z.object({
  titleEn: z.string().min(1, "Title (English) is required"),
  titleAr: z.string().optional(),
  contentEn: z.string().min(1, "Content (English) is required"),
  contentAr: z.string().optional(),
  type: z.enum([
    "LIABILITY_WAIVER",
    "TERMS_CONDITIONS",
    "HEALTH_DISCLOSURE",
    "PRIVACY_POLICY",
    "PHOTO_CONSENT",
    "MARKETING_CONSENT",
    "RULES_REGULATIONS",
    "CUSTOM",
  ]),
  isMandatory: z.boolean().default(false),
  hasHealthQuestions: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  effectiveDate: z.date().optional(),
});

export type AgreementFormData = z.infer<typeof agreementSchema>;

interface AgreementFormProps {
  agreement?: Agreement;
  onSubmit: (data: CreateAgreementRequest | UpdateAgreementRequest) => void;
  isPending?: boolean;
  onCancel?: () => void;
}

export function AgreementForm({ agreement, onSubmit, isPending, onCancel }: AgreementFormProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<AgreementFormData>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
      titleEn: agreement?.title.en || "",
      titleAr: agreement?.title.ar || "",
      contentEn: agreement?.content.en || "",
      contentAr: agreement?.content.ar || "",
      type: agreement?.type || "TERMS_CONDITIONS",
      isMandatory: agreement?.isMandatory ?? false,
      hasHealthQuestions: agreement?.hasHealthQuestions ?? false,
      sortOrder: agreement?.sortOrder ?? 0,
      effectiveDate: agreement?.effectiveDate
        ? new Date(agreement.effectiveDate)
        : new Date(),
    },
  });

  const agreementType = watch("type");

  const handleFormSubmit = (data: AgreementFormData) => {
    const payload: CreateAgreementRequest | UpdateAgreementRequest = {
      title: { en: data.titleEn, ar: data.titleAr || undefined },
      content: { en: data.contentEn, ar: data.contentAr || undefined },
      type: data.type,
      isMandatory: data.isMandatory,
      hasHealthQuestions: data.hasHealthQuestions,
      sortOrder: data.sortOrder,
    };
    onSubmit(payload);
  };

  const texts = {
    basicInfo: isArabic ? "المعلومات الأساسية" : "Basic Information",
    basicInfoDesc: isArabic
      ? "العنوان والنوع وتاريخ السريان"
      : "Title, type, and effective date",
    titleEn: isArabic ? "العنوان (الإنجليزية)" : "Title (English)",
    titleAr: isArabic ? "العنوان (العربية)" : "Title (Arabic)",
    type: isArabic ? "النوع" : "Type",
    selectType: isArabic ? "اختر النوع" : "Select type",
    effectiveDate: isArabic ? "تاريخ السريان" : "Effective Date",
    selectDate: isArabic ? "اختر التاريخ" : "Select date",
    sortOrder: isArabic ? "ترتيب العرض" : "Sort Order",
    content: isArabic ? "المحتوى" : "Content",
    contentDesc: isArabic
      ? "نص الاتفاقية الكامل"
      : "The full text of the agreement",
    contentEn: isArabic ? "المحتوى (الإنجليزية)" : "Content (English)",
    contentAr: isArabic ? "المحتوى (العربية)" : "Content (Arabic)",
    contentPlaceholder: isArabic
      ? "أدخل نص الاتفاقية هنا..."
      : "Enter the agreement text here...",
    settings: isArabic ? "الإعدادات" : "Settings",
    settingsDesc: isArabic
      ? "تكوين سلوك الاتفاقية"
      : "Configure agreement behavior",
    mandatory: isArabic ? "إلزامي" : "Mandatory",
    mandatoryDesc: isArabic
      ? "يجب على الأعضاء الموافقة على هذه الاتفاقية"
      : "Members must agree to this agreement",
    healthQuestions: isArabic ? "أسئلة صحية" : "Health Questions",
    healthQuestionsDesc: isArabic
      ? "تتضمن هذه الاتفاقية أسئلة صحية"
      : "This agreement includes health-related questions",
    cancel: isArabic ? "إلغاء" : "Cancel",
    save: isArabic ? "حفظ" : "Save",
    saving: isArabic ? "جاري الحفظ..." : "Saving...",
    create: isArabic ? "إنشاء" : "Create",
    creating: isArabic ? "جاري الإنشاء..." : "Creating...",
    required: isArabic ? "مطلوب" : "Required",
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.basicInfo}</CardTitle>
          <CardDescription>{texts.basicInfoDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title EN */}
          <div className="space-y-2">
            <Label htmlFor="titleEn">
              {texts.titleEn}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="titleEn"
              {...register("titleEn")}
              placeholder="e.g., Liability Waiver"
              dir="ltr"
            />
            {errors.titleEn && (
              <p className="text-sm text-destructive">{errors.titleEn.message}</p>
            )}
          </div>

          {/* Title AR */}
          <div className="space-y-2">
            <Label htmlFor="titleAr">{texts.titleAr}</Label>
            <Input
              id="titleAr"
              {...register("titleAr")}
              placeholder="مثال: إخلاء المسؤولية"
              dir="rtl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                {texts.type}
                <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder={texts.selectType} />
                    </SelectTrigger>
                    <SelectContent>
                      {AGREEMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {isArabic ? TYPE_LABELS[type].ar : TYPE_LABELS[type].en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="sortOrder">{texts.sortOrder}</Label>
              <Input
                id="sortOrder"
                type="number"
                min={0}
                {...register("sortOrder", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Effective Date */}
          <div className="space-y-2">
            <Label>{texts.effectiveDate}</Label>
            <Controller
              name="effectiveDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="me-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP", { locale: dateLocale })
                      ) : (
                        <span>{texts.selectDate}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      locale={dateLocale}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.content}</CardTitle>
          <CardDescription>{texts.contentDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content EN */}
          <div className="space-y-2">
            <Label htmlFor="contentEn">
              {texts.contentEn}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="contentEn"
              {...register("contentEn")}
              placeholder={texts.contentPlaceholder}
              rows={8}
              dir="ltr"
              className="font-mono text-sm"
            />
            {errors.contentEn && (
              <p className="text-sm text-destructive">{errors.contentEn.message}</p>
            )}
          </div>

          {/* Content AR */}
          <div className="space-y-2">
            <Label htmlFor="contentAr">{texts.contentAr}</Label>
            <Textarea
              id="contentAr"
              {...register("contentAr")}
              placeholder={texts.contentPlaceholder}
              rows={8}
              dir="rtl"
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.settings}</CardTitle>
          <CardDescription>{texts.settingsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mandatory */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isMandatory">{texts.mandatory}</Label>
              <p className="text-sm text-muted-foreground">
                {texts.mandatoryDesc}
              </p>
            </div>
            <Controller
              name="isMandatory"
              control={control}
              render={({ field }) => (
                <Switch
                  id="isMandatory"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Health Questions */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hasHealthQuestions">{texts.healthQuestions}</Label>
              <p className="text-sm text-muted-foreground">
                {texts.healthQuestionsDesc}
              </p>
            </div>
            <Controller
              name="hasHealthQuestions"
              control={control}
              render={({ field }) => (
                <Switch
                  id="hasHealthQuestions"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {texts.cancel}
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {agreement ? texts.saving : texts.creating}
            </>
          ) : (
            agreement ? texts.save : texts.create
          )}
        </Button>
      </div>
    </form>
  );
}
