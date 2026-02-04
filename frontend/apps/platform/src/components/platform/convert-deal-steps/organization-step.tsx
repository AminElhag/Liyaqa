"use client";

import { UseFormReturn } from "react-hook-form";
import { Building2 } from "lucide-react";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { cn } from "@liyaqa/shared/utils";
import type { OrganizationType } from "@liyaqa/shared/types/organization";
import type { ConvertDealFormValues } from "./types";

interface OrganizationStepProps {
  form: UseFormReturn<ConvertDealFormValues>;
  locale: string;
}

const ORG_TYPES: { value: OrganizationType; labelEn: string; labelAr: string }[] = [
  { value: "LLC", labelEn: "LLC", labelAr: "ذ.م.م" },
  { value: "SOLE_PROPRIETORSHIP", labelEn: "Sole Proprietorship", labelAr: "مؤسسة فردية" },
  { value: "PARTNERSHIP", labelEn: "Partnership", labelAr: "شراكة" },
  { value: "CORPORATION", labelEn: "Corporation", labelAr: "شركة مساهمة" },
  { value: "OTHER", labelEn: "Other", labelAr: "أخرى" },
];

export function OrganizationStep({ form, locale }: OrganizationStepProps) {
  const isRtl = locale === "ar";
  const { register, formState: { errors }, watch, setValue } = form;
  const watchOrgType = watch("organizationType");

  const texts = {
    title: locale === "ar" ? "تفاصيل المنظمة" : "Organization Details",
    description:
      locale === "ar"
        ? "أدخل معلومات المنظمة الأساسية. سيتم إنشاء منظمة جديدة لهذا العميل."
        : "Enter the basic organization information. A new organization will be created for this client.",
    nameEn: locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)",
    nameAr: locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)",
    tradeNameEn: locale === "ar" ? "الاسم التجاري (إنجليزي)" : "Trade Name (English)",
    tradeNameAr: locale === "ar" ? "الاسم التجاري (عربي)" : "Trade Name (Arabic)",
    type: locale === "ar" ? "نوع المنظمة" : "Organization Type",
    selectType: locale === "ar" ? "اختر النوع" : "Select type",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "رقم الهاتف" : "Phone Number",
    website: locale === "ar" ? "الموقع الإلكتروني" : "Website",
    vatNumber: locale === "ar" ? "رقم السجل الضريبي" : "VAT Registration Number",
    crNumber: locale === "ar" ? "رقم السجل التجاري" : "Commercial Registration",
    required: locale === "ar" ? "مطلوب" : "Required",
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
              placeholder="فيتنس برو"
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
              placeholder="فيت برو"
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
