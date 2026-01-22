"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Organization } from "@/types/organization";

const organizationFormSchema = z.object({
  name: z.object({
    en: z.string().min(1, "English name is required"),
    ar: z.string().nullish(),
  }),
  email: z.string().email("Invalid email address"),
  phone: z.string().nullish(),
  website: z.string().url("Invalid URL").or(z.literal("")).nullish(),
  address: z.object({
    en: z.string().nullish(),
    ar: z.string().nullish(),
  }).nullish(),
  zatcaSellerName: z.string().nullish(),
  zatcaVatNumber: z.string().nullish(),
});

export type OrganizationFormData = z.infer<typeof organizationFormSchema>;

interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (data: OrganizationFormData) => void;
  isPending?: boolean;
}

export function OrganizationForm({
  organization,
  onSubmit,
  isPending,
}: OrganizationFormProps) {
  const locale = useLocale();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: {
        en: organization?.name.en || "",
        ar: organization?.name.ar || "",
      },
      email: organization?.email || "",
      phone: organization?.phone || "",
      website: organization?.website || "",
      address: {
        en: organization?.address?.en || "",
        ar: organization?.address?.ar || "",
      },
      zatcaSellerName: organization?.zatcaSellerName || "",
      zatcaVatNumber: organization?.zatcaVatNumber || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "المعلومات الأساسية" : "Basic Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name.en">
                {locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)"} *
              </Label>
              <Input
                id="name.en"
                {...register("name.en")}
                placeholder="Organization name"
              />
              {errors.name?.en && (
                <p className="text-sm text-danger">{errors.name.en.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name.ar">
                {locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}
              </Label>
              <Input
                id="name.ar"
                {...register("name.ar")}
                placeholder="اسم المنظمة"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">
                {locale === "ar" ? "البريد الإلكتروني" : "Email"} *
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="org@example.com"
              />
              {errors.email && (
                <p className="text-sm text-danger">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                {locale === "ar" ? "الهاتف" : "Phone"}
              </Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+966 xxx xxx xxxx"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">
              {locale === "ar" ? "الموقع الإلكتروني" : "Website"}
            </Label>
            <Input
              id="website"
              {...register("website")}
              placeholder="https://example.com"
            />
            {errors.website && (
              <p className="text-sm text-danger">{errors.website.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address.en">
                {locale === "ar" ? "العنوان (إنجليزي)" : "Address (English)"}
              </Label>
              <Input
                id="address.en"
                {...register("address.en")}
                placeholder="Address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address.ar">
                {locale === "ar" ? "العنوان (عربي)" : "Address (Arabic)"}
              </Label>
              <Input
                id="address.ar"
                {...register("address.ar")}
                placeholder="العنوان"
                dir="rtl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ZATCA Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "معلومات الفوترة الإلكترونية" : "E-Invoicing (ZATCA)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="zatcaSellerName">
                {locale === "ar" ? "اسم البائع" : "Seller Name"}
              </Label>
              <Input
                id="zatcaSellerName"
                {...register("zatcaSellerName")}
                placeholder="Business legal name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zatcaVatNumber">
                {locale === "ar" ? "رقم ضريبة القيمة المضافة" : "VAT Number"}
              </Label>
              <Input
                id="zatcaVatNumber"
                {...register("zatcaVatNumber")}
                placeholder="15 digits"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? locale === "ar"
              ? "جاري الحفظ..."
              : "Saving..."
            : organization
              ? locale === "ar"
                ? "حفظ التغييرات"
                : "Save Changes"
              : locale === "ar"
                ? "إنشاء المنظمة"
                : "Create Organization"}
        </Button>
      </div>
    </form>
  );
}
