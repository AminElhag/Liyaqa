"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useOrganizations } from "@liyaqa/shared/queries/use-organizations";
import { getLocalizedText } from "@liyaqa/shared/utils";
import type { Club } from "@liyaqa/shared/types/organization";

const clubFormSchema = z.object({
  organizationId: z.string().min(1, "Organization is required"),
  name: z.object({
    en: z.string().min(1, "English name is required"),
    ar: z.string().nullish(),
  }),
  email: z.string().email("Invalid email address"),
  phone: z.string().nullish(),
  address: z.object({
    en: z.string().nullish(),
    ar: z.string().nullish(),
  }).nullish(),
});

export type ClubFormData = z.infer<typeof clubFormSchema>;

interface ClubFormProps {
  club?: Club;
  defaultOrganizationId?: string;
  onSubmit: (data: ClubFormData) => void;
  isPending?: boolean;
}

export function ClubForm({
  club,
  defaultOrganizationId,
  onSubmit,
  isPending,
}: ClubFormProps) {
  const locale = useLocale();
  const { data: organizations, isLoading: orgsLoading } = useOrganizations({
    status: "ACTIVE",
    size: 100,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClubFormData>({
    resolver: zodResolver(clubFormSchema),
    defaultValues: {
      organizationId: club?.organizationId || defaultOrganizationId || "",
      name: {
        en: club?.name.en || "",
        ar: club?.name.ar || "",
      },
      email: club?.email || "",
      phone: club?.phone || "",
      address: {
        en: club?.address?.en || "",
        ar: club?.address?.ar || "",
      },
    },
  });

  const selectedOrgId = watch("organizationId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Organization Selection */}
      {!club && (
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "ar" ? "المنظمة" : "Organization"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orgsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="organizationId">
                  {locale === "ar" ? "المنظمة" : "Organization"} *
                </Label>
                <Select
                  value={selectedOrgId}
                  onValueChange={(value) => setValue("organizationId", value)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        locale === "ar" ? "اختر المنظمة" : "Select organization"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations?.content.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {getLocalizedText(org.name, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.organizationId && (
                  <p className="text-sm text-danger">
                    {errors.organizationId.message}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                placeholder="Club name"
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
                placeholder="اسم النادي"
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
                placeholder="club@example.com"
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

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? locale === "ar"
              ? "جاري الحفظ..."
              : "Saving..."
            : club
              ? locale === "ar"
                ? "حفظ التغييرات"
                : "Save Changes"
              : locale === "ar"
                ? "إنشاء النادي"
                : "Create Club"}
        </Button>
      </div>
    </form>
  );
}
