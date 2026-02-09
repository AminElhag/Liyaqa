import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
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
import type { Deal, DealSource } from "@/types";

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
  { value: "WEBSITE", labelEn: "Website", labelAr: "\u0627\u0644\u0645\u0648\u0642\u0639" },
  { value: "REFERRAL", labelEn: "Referral", labelAr: "\u0625\u062D\u0627\u0644\u0629" },
  { value: "COLD_CALL", labelEn: "Cold Call", labelAr: "\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0631\u062F" },
  { value: "MARKETING_CAMPAIGN", labelEn: "Marketing Campaign", labelAr: "\u062D\u0645\u0644\u0629 \u062A\u0633\u0648\u064A\u0642\u064A\u0629" },
  { value: "EVENT", labelEn: "Event", labelAr: "\u062D\u062F\u062B" },
  { value: "PARTNER", labelEn: "Partner", labelAr: "\u0634\u0631\u064A\u0643" },
  { value: "OTHER", labelEn: "Other", labelAr: "\u0623\u062E\u0631\u0649" },
];

export function DealForm({
  deal,
  salesReps,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: DealFormProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(dealFormSchema) as any,
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
    basicInfo: locale === "ar" ? "\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0635\u0641\u0642\u0629" : "Deal Information",
    basicInfoDesc: locale === "ar" ? "\u0623\u062F\u062E\u0644 \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0635\u0641\u0642\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629" : "Enter the deal's basic information",
    facilityName: locale === "ar" ? "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u0634\u0623\u0629" : "Facility Name",
    source: locale === "ar" ? "\u0627\u0644\u0645\u0635\u062F\u0631" : "Source",
    selectSource: locale === "ar" ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u0645\u0635\u062F\u0631" : "Select source",
    contactInfo: locale === "ar" ? "\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644" : "Contact Information",
    contactInfoDesc: locale === "ar" ? "\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0639\u0645\u064A\u0644 \u0627\u0644\u0645\u062D\u062A\u0645\u0644" : "Contact details for the prospect",
    contactName: locale === "ar" ? "\u0627\u0633\u0645 \u062C\u0647\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644" : "Contact Name",
    contactEmail: locale === "ar" ? "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" : "Email",
    contactPhone: locale === "ar" ? "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641" : "Phone",
    dealDetails: locale === "ar" ? "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0635\u0641\u0642\u0629" : "Deal Details",
    dealDetailsDesc: locale === "ar" ? "\u0627\u0644\u0642\u064A\u0645\u0629 \u0648\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0645\u062A\u0648\u0642\u0639" : "Value and expected close date",
    estimatedValue: locale === "ar" ? "\u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0642\u062F\u0631\u0629" : "Estimated Value",
    currency: locale === "ar" ? "\u0627\u0644\u0639\u0645\u0644\u0629" : "Currency",
    expectedCloseDate: locale === "ar" ? "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0645\u062A\u0648\u0642\u0639" : "Expected Close Date",
    assignment: locale === "ar" ? "\u0627\u0644\u062A\u0639\u064A\u064A\u0646" : "Assignment",
    assignmentDesc: locale === "ar" ? "\u0645\u0646\u062F\u0648\u0628 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A" : "Sales rep assignment",
    salesRep: locale === "ar" ? "\u0645\u0646\u062F\u0648\u0628 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A" : "Sales Rep",
    selectSalesRep: locale === "ar" ? "\u0627\u062E\u062A\u0631 \u0645\u0646\u062F\u0648\u0628 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A" : "Select sales rep",
    notes: locale === "ar" ? "\u0645\u0644\u0627\u062D\u0638\u0627\u062A" : "Notes",
    notesPlaceholder: locale === "ar" ? "\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0625\u0636\u0627\u0641\u064A\u0629 \u0639\u0646 \u0627\u0644\u0635\u0641\u0642\u0629..." : "Additional notes about the deal...",
    cancel: locale === "ar" ? "\u0625\u0644\u063A\u0627\u0621" : "Cancel",
    save: locale === "ar" ? "\u062D\u0641\u0638" : "Save",
    saving: locale === "ar" ? "\u062C\u0627\u0631\u064A \u0627\u0644\u062D\u0641\u0638..." : "Saving...",
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
