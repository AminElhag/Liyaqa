"use client";

import { UseFormReturn } from "react-hook-form";
import { Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ConvertDealFormValues } from "./types";

interface ClubStepProps {
  form: UseFormReturn<ConvertDealFormValues>;
  locale: string;
}

export function ClubStep({ form, locale }: ClubStepProps) {
  const isRtl = locale === "ar";
  const { register, formState: { errors } } = form;

  const texts = {
    title: locale === "ar" ? "تفاصيل النادي" : "Club Details",
    description:
      locale === "ar"
        ? "أدخل معلومات النادي الأول. يمكن إضافة المزيد من الأندية لاحقاً."
        : "Enter the first club information. More clubs can be added later.",
    nameEn: locale === "ar" ? "اسم النادي (إنجليزي)" : "Club Name (English)",
    nameAr: locale === "ar" ? "اسم النادي (عربي)" : "Club Name (Arabic)",
    descriptionEn: locale === "ar" ? "الوصف (إنجليزي)" : "Description (English)",
    descriptionAr: locale === "ar" ? "الوصف (عربي)" : "Description (Arabic)",
    descPlaceholderEn: "A brief description of the club, its facilities, and services...",
    descPlaceholderAr: "وصف مختصر للنادي ومرافقه وخدماته...",
  };

  return (
    <Card className="border-emerald-500/20 dark:border-emerald-500/30">
      <CardHeader className={cn(isRtl && "text-right")}>
        <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-lg">{texts.title}</CardTitle>
            <CardDescription className="mt-1">{texts.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Club Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clubNameEn" className={cn(isRtl && "text-right block")}>
              {texts.nameEn} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="clubNameEn"
              {...register("clubNameEn")}
              className={cn(errors.clubNameEn && "border-destructive")}
              placeholder="Main Fitness Club"
            />
            {errors.clubNameEn && (
              <p className={cn("text-sm text-destructive", isRtl && "text-right")}>
                {errors.clubNameEn.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="clubNameAr" className={cn(isRtl && "text-right block")}>
              {texts.nameAr}
            </Label>
            <Input
              id="clubNameAr"
              {...register("clubNameAr")}
              dir="rtl"
              placeholder="نادي اللياقة الرئيسي"
              className="text-right"
            />
          </div>
        </div>

        {/* Club Descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clubDescriptionEn" className={cn(isRtl && "text-right block")}>
              {texts.descriptionEn}
            </Label>
            <Textarea
              id="clubDescriptionEn"
              {...register("clubDescriptionEn")}
              rows={4}
              placeholder={texts.descPlaceholderEn}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clubDescriptionAr" className={cn(isRtl && "text-right block")}>
              {texts.descriptionAr}
            </Label>
            <Textarea
              id="clubDescriptionAr"
              {...register("clubDescriptionAr")}
              rows={4}
              dir="rtl"
              placeholder={texts.descPlaceholderAr}
              className="resize-none text-right"
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className={cn(
          "flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900",
          isRtl && "flex-row-reverse text-right"
        )}>
          <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div className="text-sm text-emerald-800 dark:text-emerald-200">
            {locale === "ar" ? (
              <>
                <strong>ملاحظة:</strong> يمكن إضافة المزيد من الأندية والفروع بعد إنشاء العميل من خلال لوحة التحكم.
              </>
            ) : (
              <>
                <strong>Note:</strong> Additional clubs and branches can be added after client creation through the admin dashboard.
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
