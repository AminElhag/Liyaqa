"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Switch } from "@liyaqa/shared/components/ui/switch";
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
import { Calendar } from "@liyaqa/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@liyaqa/shared/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@liyaqa/shared/components/ui/tabs";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@liyaqa/shared/utils";
import {
  useCreateClubAgreement,
  useUpdateClubAgreement,
} from "@liyaqa/shared/queries/platform/use-club-agreements";
import type { Agreement, AgreementType } from "@liyaqa/shared/types/agreement";
import { toast } from "sonner";
import { useEffect } from "react";

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

const TYPE_LABELS: Record<AgreementType, { en: string; ar: string }> = {
  LIABILITY_WAIVER: { en: "Liability Waiver", ar: "إخلاء المسؤولية" },
  TERMS_CONDITIONS: { en: "Terms & Conditions", ar: "الشروط والأحكام" },
  HEALTH_DISCLOSURE: { en: "Health Disclosure", ar: "الإفصاح الصحي" },
  PRIVACY_POLICY: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  PHOTO_CONSENT: { en: "Photo Consent", ar: "موافقة التصوير" },
  MARKETING_CONSENT: { en: "Marketing Consent", ar: "موافقة التسويق" },
  RULES_REGULATIONS: { en: "Rules & Regulations", ar: "القواعد واللوائح" },
  CUSTOM: { en: "Custom", ar: "مخصص" },
};

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

type AgreementFormData = z.infer<typeof agreementSchema>;

interface AgreementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreement: Agreement | null;
  clubId: string;
  locale: string;
}

export function AgreementFormDialog({
  open,
  onOpenChange,
  agreement,
  clubId,
  locale,
}: AgreementFormDialogProps) {
  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;
  const isEditing = !!agreement;

  const createMutation = useCreateClubAgreement(clubId);
  const updateMutation = useUpdateClubAgreement(clubId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AgreementFormData>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
      titleEn: "",
      titleAr: "",
      contentEn: "",
      contentAr: "",
      type: "TERMS_CONDITIONS",
      isMandatory: false,
      hasHealthQuestions: false,
      sortOrder: 0,
      effectiveDate: new Date(),
    },
  });

  // Reset form when agreement changes
  useEffect(() => {
    if (agreement) {
      reset({
        titleEn: agreement.title.en || "",
        titleAr: agreement.title.ar || "",
        contentEn: agreement.content.en || "",
        contentAr: agreement.content.ar || "",
        type: agreement.type,
        isMandatory: agreement.isMandatory,
        hasHealthQuestions: agreement.hasHealthQuestions,
        sortOrder: agreement.sortOrder,
        effectiveDate: new Date(agreement.effectiveDate),
      });
    } else {
      reset({
        titleEn: "",
        titleAr: "",
        contentEn: "",
        contentAr: "",
        type: "TERMS_CONDITIONS",
        isMandatory: false,
        hasHealthQuestions: false,
        sortOrder: 0,
        effectiveDate: new Date(),
      });
    }
  }, [agreement, reset]);

  const texts = {
    createTitle: isArabic ? "إنشاء اتفاقية جديدة" : "Create New Agreement",
    editTitle: isArabic ? "تعديل الاتفاقية" : "Edit Agreement",
    createDesc: isArabic
      ? "إنشاء قالب اتفاقية جديد للنادي"
      : "Create a new agreement template for the club",
    editDesc: isArabic
      ? "تعديل محتوى وإعدادات الاتفاقية"
      : "Edit the agreement content and settings",
    basicInfo: isArabic ? "معلومات أساسية" : "Basic Info",
    content: isArabic ? "المحتوى" : "Content",
    settings: isArabic ? "الإعدادات" : "Settings",
    titleEn: isArabic ? "العنوان (الإنجليزية)" : "Title (English)",
    titleAr: isArabic ? "العنوان (العربية)" : "Title (Arabic)",
    contentEn: isArabic ? "المحتوى (الإنجليزية)" : "Content (English)",
    contentAr: isArabic ? "المحتوى (العربية)" : "Content (Arabic)",
    type: isArabic ? "النوع" : "Type",
    selectType: isArabic ? "اختر النوع" : "Select type",
    sortOrder: isArabic ? "ترتيب العرض" : "Sort Order",
    effectiveDate: isArabic ? "تاريخ السريان" : "Effective Date",
    selectDate: isArabic ? "اختر التاريخ" : "Select date",
    mandatory: isArabic ? "إلزامي" : "Mandatory",
    mandatoryDesc: isArabic
      ? "يجب على الأعضاء الموافقة على هذه الاتفاقية"
      : "Members must agree to this",
    healthQuestions: isArabic ? "أسئلة صحية" : "Health Questions",
    healthQuestionsDesc: isArabic
      ? "تتضمن أسئلة صحية"
      : "Includes health questions",
    cancel: isArabic ? "إلغاء" : "Cancel",
    save: isArabic ? "حفظ" : "Save",
    create: isArabic ? "إنشاء" : "Create",
    saving: isArabic ? "جاري الحفظ..." : "Saving...",
    creating: isArabic ? "جاري الإنشاء..." : "Creating...",
    created: isArabic ? "تم إنشاء الاتفاقية" : "Agreement created",
    updated: isArabic ? "تم تحديث الاتفاقية" : "Agreement updated",
    failed: isArabic ? "فشل في حفظ الاتفاقية" : "Failed to save agreement",
    required: isArabic ? "مطلوب" : "Required",
  };

  const handleFormSubmit = async (data: AgreementFormData) => {
    const payload = {
      title: { en: data.titleEn, ar: data.titleAr || undefined },
      content: { en: data.contentEn, ar: data.contentAr || undefined },
      type: data.type,
      isMandatory: data.isMandatory,
      hasHealthQuestions: data.hasHealthQuestions,
      sortOrder: data.sortOrder,
    };

    try {
      if (isEditing && agreement) {
        await updateMutation.mutateAsync({
          agreementId: agreement.id,
          data: payload,
        });
        toast.success(texts.updated);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(texts.created);
      }
      onOpenChange(false);
    } catch {
      toast.error(texts.failed);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? texts.editTitle : texts.createTitle}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? texts.editDesc : texts.createDesc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">{texts.basicInfo}</TabsTrigger>
              <TabsTrigger value="content">{texts.content}</TabsTrigger>
              <TabsTrigger value="settings">{texts.settings}</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
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

              <div className="space-y-2">
                <Label htmlFor="titleAr">{texts.titleAr}</Label>
                <Input
                  id="titleAr"
                  {...register("titleAr")}
                  placeholder="مثال: إخلاء المسؤولية"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{texts.type}<span className="text-destructive">*</span></Label>
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
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="contentEn">
                  {texts.contentEn}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="contentEn"
                  {...register("contentEn")}
                  placeholder="Enter the agreement text..."
                  rows={8}
                  dir="ltr"
                  className="font-mono text-sm"
                />
                {errors.contentEn && (
                  <p className="text-sm text-destructive">{errors.contentEn.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentAr">{texts.contentAr}</Label>
                <Textarea
                  id="contentAr"
                  {...register("contentAr")}
                  placeholder="أدخل نص الاتفاقية..."
                  rows={8}
                  dir="rtl"
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 mt-4">
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
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {texts.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {isEditing ? texts.saving : texts.creating}
                </>
              ) : (
                isEditing ? texts.save : texts.create
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
