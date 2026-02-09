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
import type { Deal, DealSource } from "@/types/platform";

// Zod schema matching backend DealCreateRequest/DealUpdateRequest
const dealFormSchema = z.object({
  facilityName: z.string().optional(),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().optional(),
  source: z.enum([
    "WEBSITE",
    "REFERRAL",
    "COLD_CALL",
    "MARKETING_CAMPAIGN",
    "EVENT",
    "PARTNER",
    "OTHER",
  ]),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
  estimatedValue: z.coerce.number().min(0, "Value must be positive"),
  currency: z.string().default("SAR"),
  expectedCloseDate: z.string().optional(),
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
      facilityName: deal?.facilityName || "",
      source: deal?.source || "WEBSITE",
      contactName: deal?.contactName || "",
      contactEmail: deal?.contactEmail || "",
      contactPhone: deal?.contactPhone || "",
      estimatedValue: deal?.estimatedValue || 0,
      currency: deal?.currency || "SAR",
      expectedCloseDate: deal?.expectedCloseDate || "",
      assignedToId: deal?.assignedTo?.id || "",
      notes: deal?.notes || "",
    },
  });

  const texts = {
    basicInfo: locale === "ar" ? "معلومات الصفقة" : "Deal Information",
    basicInfoDesc: locale === "ar" ? "أدخل معلومات الصفقة الأساسية" : "Enter the deal's basic information",
    facilityName: locale === "ar" ? "اسم المنشأة" : "Facility Name",
    source: locale === "ar" ? "المصدر" : "Source",
    selectSource: locale === "ar" ? "اختر المصدر" : "Select source",
    contactInfo: locale === "ar" ? "معلومات الاتصال" : "Contact Information",
    contactInfoDesc: locale === "ar" ? "معلومات الاتصال بالعميل المحتمل" : "Contact details for the prospect",
    contactName: locale === "ar" ? "اسم جهة الاتصال" : "Contact Name",
    contactEmail: locale === "ar" ? "البريد الإلكتروني" : "Email",
    contactPhone: locale === "ar" ? "رقم الهاتف" : "Phone",
    dealDetails: locale === "ar" ? "تفاصيل الصفقة" : "Deal Details",
    dealDetailsDesc: locale === "ar" ? "القيمة وتاريخ الإغلاق المتوقع" : "Value and expected close date",
    estimatedValue: locale === "ar" ? "القيمة المقدرة" : "Estimated Value",
    currency: locale === "ar" ? "العملة" : "Currency",
    expectedCloseDate: locale === "ar" ? "تاريخ الإغلاق المتوقع" : "Expected Close Date",
    assignment: locale === "ar" ? "التعيين" : "Assignment",
    assignmentDesc: locale === "ar" ? "مندوب المبيعات" : "Sales rep assignment",
    salesRep: locale === "ar" ? "مندوب المبيعات" : "Sales Rep",
    selectSalesRep: locale === "ar" ? "اختر مندوب المبيعات" : "Select sales rep",
    notes: locale === "ar" ? "ملاحظات" : "Notes",
    notesPlaceholder: locale === "ar" ? "ملاحظات إضافية عن الصفقة..." : "Additional notes about the deal...",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    save: locale === "ar" ? "حفظ" : "Save",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
  };

  const watchSource = watch("source");
  const watchAssignedToId = watch("assignedToId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.basicInfo}</CardTitle>
          <CardDescription>{texts.basicInfoDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facilityName">{texts.facilityName}</Label>
            <Input
              id="facilityName"
              {...register("facilityName")}
              placeholder="New Gym Partnership"
            />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">{texts.contactPhone}</Label>
            <Input
              id="contactPhone"
              {...register("contactPhone")}
              placeholder="+966 50 123 4567"
            />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">{texts.estimatedValue}</Label>
              <Input
                id="estimatedValue"
                type="number"
                {...register("estimatedValue")}
                placeholder="10000"
              />
              {errors.estimatedValue && (
                <p className="text-sm text-destructive">{errors.estimatedValue.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{texts.currency}</Label>
              <Select
                value={watch("currency")}
                onValueChange={(value) => setValue("currency", value)}
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
      {salesReps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{texts.assignment}</CardTitle>
            <CardDescription>{texts.assignmentDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{texts.salesRep}</Label>
              <Select
                value={watchAssignedToId || ""}
                onValueChange={(value) => setValue("assignedToId", value)}
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.notes}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Textarea
              {...register("notes")}
              placeholder={texts.notesPlaceholder}
              rows={3}
            />
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
