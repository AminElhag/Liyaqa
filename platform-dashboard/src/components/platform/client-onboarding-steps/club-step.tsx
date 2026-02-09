import type { UseFormReturn } from "react-hook-form";
import { Store, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OnboardingFormValues } from "./types";

interface ClubStepProps {
  form: UseFormReturn<OnboardingFormValues>;
  locale: string;
}

export function ClubStep({ form, locale }: ClubStepProps) {
  const isRtl = locale === "ar";
  const { register, formState: { errors }, watch } = form;
  const watchClubSlug = watch("clubSlug");

  const texts = {
    title: locale === "ar" ? "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0646\u0627\u062F\u064A" : "Club Details",
    description:
      locale === "ar"
        ? "\u0623\u062F\u062E\u0644 \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0646\u0627\u062F\u064A \u0627\u0644\u0623\u0648\u0644. \u064A\u0645\u0643\u0646 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u0623\u0646\u062F\u064A\u0629 \u0644\u0627\u062D\u0642\u0627\u064B."
        : "Enter the first club information. More clubs can be added later.",
    nameEn: locale === "ar" ? "\u0627\u0633\u0645 \u0627\u0644\u0646\u0627\u062F\u064A (\u0625\u0646\u062C\u0644\u064A\u0632\u064A)" : "Club Name (English)",
    nameAr: locale === "ar" ? "\u0627\u0633\u0645 \u0627\u0644\u0646\u0627\u062F\u064A (\u0639\u0631\u0628\u064A)" : "Club Name (Arabic)",
    descriptionEn: locale === "ar" ? "\u0627\u0644\u0648\u0635\u0641 (\u0625\u0646\u062C\u0644\u064A\u0632\u064A)" : "Description (English)",
    descriptionAr: locale === "ar" ? "\u0627\u0644\u0648\u0635\u0641 (\u0639\u0631\u0628\u064A)" : "Description (Arabic)",
    descPlaceholderEn: "A brief description of the club, its facilities, and services...",
    descPlaceholderAr: "\u0648\u0635\u0641 \u0645\u062E\u062A\u0635\u0631 \u0644\u0644\u0646\u0627\u062F\u064A \u0648\u0645\u0631\u0627\u0641\u0642\u0647 \u0648\u062E\u062F\u0645\u0627\u062A\u0647...",
    subdomain: locale === "ar" ? "\u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0641\u0631\u0639\u064A" : "Subdomain (Slug)",
    subdomainHint:
      locale === "ar"
        ? "\u0627\u062A\u0631\u0643\u0647 \u0641\u0627\u0631\u063A\u0627\u064B \u0644\u0644\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0645\u0646 \u0627\u0633\u0645 \u0627\u0644\u0646\u0627\u062F\u064A"
        : "Leave empty to auto-generate from club name",
    subdomainPreview: locale === "ar" ? "\u0645\u0639\u0627\u064A\u0646\u0629 \u0627\u0644\u0631\u0627\u0628\u0637" : "URL Preview",
    subdomainRules:
      locale === "ar"
        ? "\u0627\u0633\u062A\u062E\u062F\u0645 \u0623\u062D\u0631\u0641 \u0635\u063A\u064A\u0631\u0629 \u0648\u0623\u0631\u0642\u0627\u0645 \u0648\u0634\u0631\u0637\u0627\u062A \u0641\u0642\u0637 (\u0645\u062B\u0627\u0644: fitness-club)"
        : "Use lowercase letters, numbers, and hyphens only (e.g., fitness-club)",
    note:
      locale === "ar"
        ? "\u064A\u0645\u0643\u0646 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u0623\u0646\u062F\u064A\u0629 \u0648\u0627\u0644\u0641\u0631\u0648\u0639 \u0628\u0639\u062F \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0639\u0645\u064A\u0644 \u0645\u0646 \u062E\u0644\u0627\u0644 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645."
        : "Additional clubs and branches can be added after client creation through the admin dashboard.",
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
              placeholder="\u0646\u0627\u062F\u064A \u0627\u0644\u0644\u064A\u0627\u0642\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A"
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

        {/* Subdomain / Slug */}
        <div className="space-y-2">
          <Label htmlFor="clubSlug" className={cn(isRtl && "text-right block")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse justify-end")}>
              <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {texts.subdomain}
            </div>
          </Label>
          <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
            <Input
              id="clubSlug"
              {...register("clubSlug")}
              placeholder="fitness-club"
              className={cn("flex-1", errors.clubSlug && "border-destructive")}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">.liyaqa.com</span>
          </div>
          <p className={cn("text-xs text-muted-foreground", isRtl && "text-right")}>
            {texts.subdomainHint}
          </p>
          <p className={cn("text-xs text-muted-foreground", isRtl && "text-right")}>
            {texts.subdomainRules}
          </p>
          {watchClubSlug && watchClubSlug.length >= 3 && (
            <p className={cn("text-xs text-emerald-600 dark:text-emerald-400", isRtl && "text-right")}>
              {texts.subdomainPreview}: https://{watchClubSlug}.liyaqa.com
            </p>
          )}
          {errors.clubSlug && (
            <p className={cn("text-sm text-destructive", isRtl && "text-right")}>
              {errors.clubSlug.message}
            </p>
          )}
        </div>

        {/* Info Banner */}
        <div className={cn(
          "flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900",
          isRtl && "flex-row-reverse text-right"
        )}>
          <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div className="text-sm text-emerald-800 dark:text-emerald-200">
            <strong>{locale === "ar" ? "\u0645\u0644\u0627\u062D\u0638\u0629:" : "Note:"}</strong> {texts.note}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
