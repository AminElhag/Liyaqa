"use client";

import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Snowflake, DollarSign, Settings } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";

const freezePackageSchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  freezeDays: z.coerce.number().min(1, "Must be at least 1 day").max(365, "Maximum 365 days"),
  priceAmount: z.coerce.number().min(0, "Price must be positive"),
  priceCurrency: z.string().default("SAR"),
  extendsContract: z.boolean().default(true),
  requiresDocumentation: z.boolean().default(false),
  sortOrder: z.coerce.number().min(0).default(0),
});

export type FreezePackageFormValues = z.infer<typeof freezePackageSchema>;

interface FreezePackageFormProps {
  defaultValues?: Partial<FreezePackageFormValues>;
  onSubmit: (data: FreezePackageFormValues) => void;
  isLoading?: boolean;
  mode: "create" | "edit";
}

export function FreezePackageForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  mode,
}: FreezePackageFormProps) {
  const locale = useLocale();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FreezePackageFormValues>({
    resolver: zodResolver(freezePackageSchema),
    defaultValues: {
      nameEn: "",
      nameAr: "",
      descriptionEn: "",
      descriptionAr: "",
      freezeDays: 7,
      priceAmount: 0,
      priceCurrency: "SAR",
      extendsContract: true,
      requiresDocumentation: false,
      sortOrder: 0,
      ...defaultValues,
    },
  });

  const texts = {
    basicInfo: locale === "ar" ? "معلومات الباقة" : "Package Information",
    basicDesc: locale === "ar" ? "اسم ووصف باقة التجميد" : "Freeze package name and description",
    pricing: locale === "ar" ? "التسعير" : "Pricing",
    pricingDesc: locale === "ar" ? "سعر الباقة وعدد أيام التجميد" : "Package price and freeze days",
    settings: locale === "ar" ? "الإعدادات" : "Settings",
    settingsDesc: locale === "ar" ? "خيارات إضافية للباقة" : "Additional package options",

    nameEn: locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)",
    nameAr: locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)",
    descriptionEn: locale === "ar" ? "الوصف (إنجليزي)" : "Description (English)",
    descriptionAr: locale === "ar" ? "الوصف (عربي)" : "Description (Arabic)",
    freezeDays: locale === "ar" ? "أيام التجميد" : "Freeze Days",
    freezeDaysDesc: locale === "ar" ? "عدد أيام التجميد المتاحة في هذه الباقة" : "Number of freeze days available in this package",
    price: locale === "ar" ? "السعر" : "Price",
    priceDesc: locale === "ar" ? "سعر شراء هذه الباقة" : "Purchase price for this package",
    currency: locale === "ar" ? "العملة" : "Currency",
    extendsContract: locale === "ar" ? "تمديد العقد" : "Extends Contract",
    extendsContractDesc: locale === "ar" ? "تمديد تاريخ انتهاء الاشتراك بعدد أيام التجميد" : "Extend subscription end date by the number of freeze days",
    requiresDocs: locale === "ar" ? "يتطلب مستندات" : "Requires Documentation",
    requiresDocsDesc: locale === "ar" ? "يجب على العضو تقديم مستندات داعمة (شهادة طبية، إلخ)" : "Member must provide supporting documents (medical certificate, etc.)",
    sortOrder: locale === "ar" ? "ترتيب العرض" : "Display Order",
    sortOrderDesc: locale === "ar" ? "ترتيب ظهور الباقة في القائمة (0 = أولاً)" : "Order in which the package appears (0 = first)",

    submit:
      mode === "create"
        ? locale === "ar"
          ? "إنشاء الباقة"
          : "Create Package"
        : locale === "ar"
          ? "حفظ التغييرات"
          : "Save Changes",
    submitting: locale === "ar" ? "جاري الحفظ..." : "Saving...",
    days: locale === "ar" ? "يوم" : "days",
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: watch("priceCurrency") || "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const freezeDays = watch("freezeDays");
  const priceAmount = watch("priceAmount");
  const pricePerDay = freezeDays > 0 ? priceAmount / freezeDays : 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-blue-500" />
            <CardTitle>{texts.basicInfo}</CardTitle>
          </div>
          <CardDescription>{texts.basicDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameEn">
                {texts.nameEn} <span className="text-destructive">*</span>
              </Label>
              <Input id="nameEn" {...register("nameEn")} />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">{texts.nameAr}</Label>
              <Input id="nameAr" dir="rtl" {...register("nameAr")} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="descriptionEn">{texts.descriptionEn}</Label>
              <Textarea
                id="descriptionEn"
                {...register("descriptionEn")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionAr">{texts.descriptionAr}</Label>
              <Textarea
                id="descriptionAr"
                dir="rtl"
                {...register("descriptionAr")}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <CardTitle>{texts.pricing}</CardTitle>
          </div>
          <CardDescription>{texts.pricingDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="freezeDays">
                {texts.freezeDays} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="freezeDays"
                type="number"
                min="1"
                max="365"
                {...register("freezeDays")}
              />
              <p className="text-sm text-muted-foreground">{texts.freezeDaysDesc}</p>
              {errors.freezeDays && (
                <p className="text-sm text-destructive">{errors.freezeDays.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceAmount">
                {texts.price} <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="priceAmount"
                  type="number"
                  min="0"
                  step="1"
                  {...register("priceAmount")}
                  className="flex-1"
                />
                <Select
                  value={watch("priceCurrency")}
                  onValueChange={(value) => setValue("priceCurrency", value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">{texts.priceDesc}</p>
              {errors.priceAmount && (
                <p className="text-sm text-destructive">{errors.priceAmount.message}</p>
              )}
            </div>
          </div>

          {/* Price per day calculation */}
          {priceAmount > 0 && freezeDays > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-muted-foreground">
                {locale === "ar" ? "السعر لكل يوم" : "Price per day"}
              </p>
              <p className="text-lg font-semibold text-blue-700">
                {formatCurrency(pricePerDay)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <CardTitle>{texts.settings}</CardTitle>
          </div>
          <CardDescription>{texts.settingsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Extends Contract */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="extendsContract" className="cursor-pointer">
                  {texts.extendsContract}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {texts.extendsContractDesc}
                </p>
              </div>
              <Switch
                id="extendsContract"
                checked={watch("extendsContract")}
                onCheckedChange={(checked) => setValue("extendsContract", checked)}
              />
            </div>

            {/* Requires Documentation */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="requiresDocumentation" className="cursor-pointer">
                  {texts.requiresDocs}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {texts.requiresDocsDesc}
                </p>
              </div>
              <Switch
                id="requiresDocumentation"
                checked={watch("requiresDocumentation")}
                onCheckedChange={(checked) => setValue("requiresDocumentation", checked)}
              />
            </div>
          </div>

          {/* Sort Order */}
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">{texts.sortOrder}</Label>
              <Input
                id="sortOrder"
                type="number"
                min="0"
                {...register("sortOrder")}
                className="w-32"
              />
              <p className="text-sm text-muted-foreground">{texts.sortOrderDesc}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} size="lg">
          <Snowflake className="me-2 h-4 w-4" />
          {isLoading ? texts.submitting : texts.submit}
        </Button>
      </div>
    </form>
  );
}
