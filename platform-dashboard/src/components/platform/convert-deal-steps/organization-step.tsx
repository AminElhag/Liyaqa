import type { UseFormReturn } from "react-hook-form";
import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OrganizationType } from "@/types";
import type { ConvertDealFormValues } from "./types";

interface OrganizationStepProps {
  form: UseFormReturn<ConvertDealFormValues>;
  locale: string;
}

const ORG_TYPES: { value: OrganizationType; labelEn: string; labelAr: string }[] = [
  { value: "LLC", labelEn: "LLC", labelAr: "\u0630.\u0645.\u0645" },
  { value: "SOLE_PROPRIETORSHIP", labelEn: "Sole Proprietorship", labelAr: "\u0645\u0624\u0633\u0633\u0629 \u0641\u0631\u062F\u064A\u0629" },
  { value: "PARTNERSHIP", labelEn: "Partnership", labelAr: "\u0634\u0631\u0627\u0643\u0629" },
  { value: "CORPORATION", labelEn: "Corporation", labelAr: "\u0634\u0631\u0643\u0629 \u0645\u0633\u0627\u0647\u0645\u0629" },
  { value: "OTHER", labelEn: "Other", labelAr: "\u0623\u062E\u0631\u0649" },
];

export function OrganizationStep({ form, locale }: OrganizationStepProps) {
  const isRtl = locale === "ar";
  const { register, formState: { errors }, watch, setValue } = form;
  const watchOrgType = watch("organizationType");

  const texts = {
    title: locale === "ar" ? "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0645\u0646\u0638\u0645\u0629" : "Organization Details",
    description:
      locale === "ar"
        ? "\u0623\u062F\u062E\u0644 \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0645\u0646\u0638\u0645\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629. \u0633\u064A\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0645\u0646\u0638\u0645\u0629 \u062C\u062F\u064A\u062F\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u064A\u0644."
        : "Enter the basic organization information. A new organization will be created for this client.",
    nameEn: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645 (\u0625\u0646\u062C\u0644\u064A\u0632\u064A)" : "Name (English)",
    nameAr: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645 (\u0639\u0631\u0628\u064A)" : "Name (Arabic)",
    tradeNameEn: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u062A\u062C\u0627\u0631\u064A (\u0625\u0646\u062C\u0644\u064A\u0632\u064A)" : "Trade Name (English)",
    tradeNameAr: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u062A\u062C\u0627\u0631\u064A (\u0639\u0631\u0628\u064A)" : "Trade Name (Arabic)",
    type: locale === "ar" ? "\u0646\u0648\u0639 \u0627\u0644\u0645\u0646\u0638\u0645\u0629" : "Organization Type",
    selectType: locale === "ar" ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u0646\u0648\u0639" : "Select type",
    email: locale === "ar" ? "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" : "Email",
    phone: locale === "ar" ? "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641" : "Phone Number",
    website: locale === "ar" ? "\u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" : "Website",
    vatNumber: locale === "ar" ? "\u0631\u0642\u0645 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0636\u0631\u064A\u0628\u064A" : "VAT Registration Number",
    crNumber: locale === "ar" ? "\u0631\u0642\u0645 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u062A\u062C\u0627\u0631\u064A" : "Commercial Registration",
  };

  return (
    <Card className="border-blue-500/20 dark:border-blue-500/30">
      <CardHeader className={cn(isRtl && "text-right")}>
        <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-lg">{texts.title}</CardTitle>
            <CardDescription className="mt-1">{texts.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Names Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="organizationNameEn" className={cn(isRtl && "text-right block")}>
              {texts.nameEn} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="organizationNameEn"
              {...register("organizationNameEn")}
              className={cn(errors.organizationNameEn && "border-destructive")}
              placeholder="Fitness Pro LLC"
            />
            {errors.organizationNameEn && (
              <p className={cn("text-sm text-destructive", isRtl && "text-right")}>
                {errors.organizationNameEn.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizationNameAr" className={cn(isRtl && "text-right block")}>
              {texts.nameAr}
            </Label>
            <Input
              id="organizationNameAr"
              {...register("organizationNameAr")}
              dir="rtl"
              placeholder="\u0641\u064A\u062A\u0646\u0633 \u0628\u0631\u0648"
              className="text-right"
            />
          </div>
        </div>

        {/* Trade Names Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="organizationTradeNameEn" className={cn(isRtl && "text-right block")}>
              {texts.tradeNameEn}
            </Label>
            <Input
              id="organizationTradeNameEn"
              {...register("organizationTradeNameEn")}
              placeholder="FitPro"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizationTradeNameAr" className={cn(isRtl && "text-right block")}>
              {texts.tradeNameAr}
            </Label>
            <Input
              id="organizationTradeNameAr"
              {...register("organizationTradeNameAr")}
              dir="rtl"
              placeholder="\u0641\u064A\u062A \u0628\u0631\u0648"
              className="text-right"
            />
          </div>
        </div>

        {/* Organization Type */}
        <div className="space-y-2">
          <Label className={cn(isRtl && "text-right block")}>{texts.type}</Label>
          <Select value={watchOrgType || ""} onValueChange={(v) => setValue("organizationType", v)}>
            <SelectTrigger>
              <SelectValue placeholder={texts.selectType} />
            </SelectTrigger>
            <SelectContent>
              {ORG_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {locale === "ar" ? type.labelAr : type.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="organizationEmail" className={cn(isRtl && "text-right block")}>
              {texts.email}
            </Label>
            <Input
              id="organizationEmail"
              type="email"
              {...register("organizationEmail")}
              placeholder="contact@company.com"
              className={cn(errors.organizationEmail && "border-destructive")}
            />
            {errors.organizationEmail && (
              <p className={cn("text-sm text-destructive", isRtl && "text-right")}>
                {errors.organizationEmail.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizationPhone" className={cn(isRtl && "text-right block")}>
              {texts.phone}
            </Label>
            <Input
              id="organizationPhone"
              type="tel"
              {...register("organizationPhone")}
              placeholder="+966 5X XXX XXXX"
            />
          </div>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="organizationWebsite" className={cn(isRtl && "text-right block")}>
            {texts.website}
          </Label>
          <Input
            id="organizationWebsite"
            type="url"
            {...register("organizationWebsite")}
            placeholder="https://www.company.com"
            className={cn(errors.organizationWebsite && "border-destructive")}
          />
          {errors.organizationWebsite && (
            <p className={cn("text-sm text-destructive", isRtl && "text-right")}>
              {errors.organizationWebsite.message}
            </p>
          )}
        </div>

        {/* Registration Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vatRegistrationNumber" className={cn(isRtl && "text-right block")}>
              {texts.vatNumber}
            </Label>
            <Input
              id="vatRegistrationNumber"
              {...register("vatRegistrationNumber")}
              placeholder="310000000000003"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commercialRegistrationNumber" className={cn(isRtl && "text-right block")}>
              {texts.crNumber}
            </Label>
            <Input
              id="commercialRegistrationNumber"
              {...register("commercialRegistrationNumber")}
              placeholder="1010000000"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
