"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Deal, DealSource, CreateDealRequest, UpdateDealRequest } from "@/types/platform";

// Zod schema for deal form
const dealFormSchema = z.object({
  titleEn: z.string().min(1, "Title (English) is required"),
  titleAr: z.string().optional(),
  source: z.enum([
    "WEBSITE",
    "REFERRAL",
    "COLD_CALL",
    "MARKETING_CAMPAIGN",
    "EVENT",
    "PARTNER",
    "OTHER",
  ]),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().optional(),
  companyName: z.string().optional(),
  estimatedValueAmount: z.coerce.number().min(0, "Value must be positive"),
  estimatedValueCurrency: z.string().default("SAR"),
  probability: z.coerce.number().min(0).max(100, "Probability must be 0-100"),
  expectedCloseDate: z.string().optional(),
  interestedPlanId: z.string().optional(),
  salesRepId: z.string().min(1, "Sales rep is required"),
  notesEn: z.string().optional(),
  notesAr: z.string().optional(),
});

export type DealFormData = z.infer<typeof dealFormSchema>;

interface SalesRep {
  id: string;
  email: string;
  displayName?: { en: string; ar?: string | null };
}

interface DealFormProps {
  deal?: Deal;
  salesReps: SalesRep[];
  plans?: Array<{ id: string; name: { en: string; ar?: string | null } }>;
  onSubmit: (data: DealFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const SOURCE_OPTIONS: Array<{ value: DealSource; labelEn: string; labelAr: string }> = [
  { value: "WEBSITE", labelEn: "Website", labelAr: "الموقع" },
  { value: "REFERRAL", labelEn: "Referral", labelAr: "إحالة" },
  { value: "COLD_CALL", labelEn: "Cold Call", labelAr: "اتصال بارد" },
  { value: "MARKETING_CAMPAIGN", labelEn: "Marketing Campaign", labelAr: "حملة تسويقية" },
  { value: "EVENT", labelEn: "Event", labelAr: "حدث" },
  { value: "PARTNER", labelEn: "Partner", labelAr: "شريك" },
  { value: "OTHER", labelEn: "Other", labelAr: "أخرى" },
];

export function DealForm({
  deal,
  salesReps,
  plans = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}: DealFormProps) {
  const locale = useLocale();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      titleEn: deal?.title?.en || "",
      titleAr: deal?.title?.ar || "",
      source: deal?.source || "WEBSITE",
      contactName: deal?.contactName || "",
      contactEmail: deal?.contactEmail || "",
      contactPhone: deal?.contactPhone || "",
      companyName: deal?.companyName || "",
      estimatedValueAmount: deal?.estimatedValue?.amount || 0,
      estimatedValueCurrency: deal?.estimatedValue?.currency || "SAR",
      probability: deal?.probability || 10,
      expectedCloseDate: deal?.expectedCloseDate || "",
      interestedPlanId: deal?.interestedPlanId || "",
      salesRepId: deal?.salesRepId || "",
      notesEn: deal?.notes?.en || "",
      notesAr: deal?.notes?.ar || "",
    },
  });

  const texts = {
    basicInfo: locale === "ar" ? "معلومات الصفقة" : "Deal Information",
    basicInfoDesc: locale === "ar" ? "أدخل معلومات الصفقة الأساسية" : "Enter the deal's basic information",
    titleEn: locale === "ar" ? "العنوان (إنجليزي)" : "Title (EN)",
    titleAr: locale === "ar" ? "العنوان (عربي)" : "Title (AR)",
    source: locale === "ar" ? "المصدر" : "Source",
    selectSource: locale === "ar" ? "اختر المصدر" : "Select source",
    contactInfo: locale === "ar" ? "معلومات الاتصال" : "Contact Information",
    contactInfoDesc: locale === "ar" ? "معلومات الاتصال بالعميل المحتمل" : "Contact details for the prospect",
    contactName: locale === "ar" ? "اسم جهة الاتصال" : "Contact Name",
    contactEmail: locale === "ar" ? "البريد الإلكتروني" : "Email",
    contactPhone: locale === "ar" ? "رقم الهاتف" : "Phone",
    companyName: locale === "ar" ? "اسم الشركة" : "Company Name",
    dealDetails: locale === "ar" ? "تفاصيل الصفقة" : "Deal Details",
    dealDetailsDesc: locale === "ar" ? "القيمة والاحتمالية وتاريخ الإغلاق المتوقع" : "Value, probability, and expected close date",
    estimatedValue: locale === "ar" ? "القيمة المقدرة" : "Estimated Value",
    currency: locale === "ar" ? "العملة" : "Currency",
    probability: locale === "ar" ? "الاحتمالية (%)" : "Probability (%)",
    expectedCloseDate: locale === "ar" ? "تاريخ الإغلاق المتوقع" : "Expected Close Date",
    assignment: locale === "ar" ? "التعيين" : "Assignment",
    assignmentDesc: locale === "ar" ? "مندوب المبيعات والخطة المهتم بها" : "Sales rep and interested plan",
    salesRep: locale === "ar" ? "مندوب المبيعات" : "Sales Rep",
    selectSalesRep: locale === "ar" ? "اختر مندوب المبيعات" : "Select sales rep",
    interestedPlan: locale === "ar" ? "الخطة المهتم بها" : "Interested Plan",
    selectPlan: locale === "ar" ? "اختر خطة (اختياري)" : "Select plan (optional)",
    none: locale === "ar" ? "لا يوجد" : "None",
    notes: locale === "ar" ? "ملاحظات" : "Notes",
    notesEn: locale === "ar" ? "ملاحظات (إنجليزي)" : "Notes (EN)",
    notesAr: locale === "ar" ? "ملاحظات (عربي)" : "Notes (AR)",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    save: locale === "ar" ? "حفظ" : "Save",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
  };

  const watchSource = watch("source");
  const watchSalesRepId = watch("salesRepId");
  const watchInterestedPlanId = watch("interestedPlanId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.basicInfo}</CardTitle>
          <CardDescription>{texts.basicInfoDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titleEn">{texts.titleEn} *</Label>
              <Input
                id="titleEn"
                {...register("titleEn")}
                placeholder="New Gym Partnership"
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
                placeholder="شراكة نادي جديد"
                dir="rtl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{texts.source}</Label>
            <Select
              value={watchSource}
              onValueChange={(value) => setValue("source", value as DealSource)}
            >
              <SelectTrigger>
                <SelectValue placeholder={texts.selectSource} />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {locale === "ar" ? option.labelAr : option.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.contactInfo}</CardTitle>
          <CardDescription>{texts.contactInfoDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">{texts.contactName} *</Label>
              <Input
                id="contactName"
                {...register("contactName")}
                placeholder="John Smith"
              />
              {errors.contactName && (
                <p className="text-sm text-destructive">{errors.contactName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">{texts.companyName}</Label>
              <Input
                id="companyName"
                {...register("companyName")}
                placeholder="Fitness Corp"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">{texts.contactEmail} *</Label>
              <Input
                id="contactEmail"
                type="email"
                {...register("contactEmail")}
                placeholder="john@example.com"
              />
              {errors.contactEmail && (
                <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">{texts.contactPhone}</Label>
              <Input
                id="contactPhone"
                {...register("contactPhone")}
                placeholder="+966 50 123 4567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deal Details */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.dealDetails}</CardTitle>
          <CardDescription>{texts.dealDetailsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedValueAmount">{texts.estimatedValue}</Label>
              <Input
                id="estimatedValueAmount"
                type="number"
                {...register("estimatedValueAmount")}
                placeholder="10000"
              />
              {errors.estimatedValueAmount && (
                <p className="text-sm text-destructive">{errors.estimatedValueAmount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedValueCurrency">{texts.currency}</Label>
              <Select
                value={watch("estimatedValueCurrency")}
                onValueChange={(value) => setValue("estimatedValueCurrency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="probability">{texts.probability}</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                {...register("probability")}
                placeholder="10"
              />
              {errors.probability && (
                <p className="text-sm text-destructive">{errors.probability.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedCloseDate">{texts.expectedCloseDate}</Label>
            <Input
              id="expectedCloseDate"
              type="date"
              {...register("expectedCloseDate")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.assignment}</CardTitle>
          <CardDescription>{texts.assignmentDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{texts.salesRep} *</Label>
              <Select
                value={watchSalesRepId}
                onValueChange={(value) => setValue("salesRepId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectSalesRep} />
                </SelectTrigger>
                <SelectContent>
                  {salesReps.map((rep) => {
                    const name = rep.displayName
                      ? locale === "ar" && rep.displayName.ar
                        ? rep.displayName.ar
                        : rep.displayName.en
                      : rep.email;
                    return (
                      <SelectItem key={rep.id} value={rep.id}>
                        {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.salesRepId && (
                <p className="text-sm text-destructive">{errors.salesRepId.message}</p>
              )}
            </div>
            {plans.length > 0 && (
              <div className="space-y-2">
                <Label>{texts.interestedPlan}</Label>
                <Select
                  value={watchInterestedPlanId || ""}
                  onValueChange={(value) => setValue("interestedPlanId", value === "" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={texts.selectPlan} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{texts.none}</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {locale === "ar" && plan.name.ar
                          ? plan.name.ar
                          : plan.name.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.notes}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notesEn">{texts.notesEn}</Label>
              <Textarea
                id="notesEn"
                {...register("notesEn")}
                placeholder="Additional notes about the deal..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notesAr">{texts.notesAr}</Label>
              <Textarea
                id="notesAr"
                {...register("notesAr")}
                placeholder="ملاحظات إضافية عن الصفقة..."
                dir="rtl"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {texts.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? texts.saving : texts.save}
        </Button>
      </div>
    </form>
  );
}
