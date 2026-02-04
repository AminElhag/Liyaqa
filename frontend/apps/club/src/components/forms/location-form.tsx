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
import { useClubs } from "@liyaqa/shared/queries/use-clubs";
import { getLocalizedText } from "@liyaqa/shared/utils";
import type { Location } from "@liyaqa/shared/types/organization";

const locationFormSchema = z.object({
  clubId: z.string().min(1, "Club is required"),
  name: z.object({
    en: z.string().min(1, "English name is required"),
    ar: z.string().nullish(),
  }),
  address: z.object({
    en: z.string().nullish(),
    ar: z.string().nullish(),
  }).nullish(),
  capacity: z.number().min(0).nullish(),
  phone: z.string().nullish(),
  email: z.string().email("Invalid email address").or(z.literal("")).nullish(),
});

export type LocationFormData = z.infer<typeof locationFormSchema>;

interface LocationFormProps {
  location?: Location;
  defaultClubId?: string;
  onSubmit: (data: LocationFormData) => void;
  isPending?: boolean;
}

export function LocationForm({
  location,
  defaultClubId,
  onSubmit,
  isPending,
}: LocationFormProps) {
  const locale = useLocale();
  const { data: clubs, isLoading: clubsLoading } = useClubs({
    status: "ACTIVE",
    size: 100,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      clubId: location?.clubId || defaultClubId || "",
      name: {
        en: location?.name.en || "",
        ar: location?.name.ar || "",
      },
      address: {
        en: location?.address?.en || "",
        ar: location?.address?.ar || "",
      },
      capacity: location?.capacity || undefined,
      phone: location?.phone || "",
      email: location?.email || "",
    },
  });

  const selectedClubId = watch("clubId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Club Selection */}
      {!location && (
        <Card>
          <CardHeader>
            <CardTitle>{locale === "ar" ? "النادي" : "Club"}</CardTitle>
          </CardHeader>
          <CardContent>
            {clubsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="clubId">
                  {locale === "ar" ? "النادي" : "Club"} *
                </Label>
                <Select
                  value={selectedClubId}
                  onValueChange={(value) => setValue("clubId", value)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        locale === "ar" ? "اختر النادي" : "Select club"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs?.content.map((club) => (
                      <SelectItem key={club.id} value={club.id}>
                        {getLocalizedText(club.name, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clubId && (
                  <p className="text-sm text-danger">{errors.clubId.message}</p>
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
                placeholder="Location name"
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
                placeholder="اسم الموقع"
                dir="rtl"
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

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="capacity">
                {locale === "ar" ? "السعة" : "Capacity"}
              </Label>
              <Input
                id="capacity"
                type="number"
                min="0"
                {...register("capacity", { valueAsNumber: true })}
                placeholder="0"
              />
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
            <div className="space-y-2">
              <Label htmlFor="email">
                {locale === "ar" ? "البريد الإلكتروني" : "Email"}
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="location@example.com"
              />
              {errors.email && (
                <p className="text-sm text-danger">{errors.email.message}</p>
              )}
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
            : location
              ? locale === "ar"
                ? "حفظ التغييرات"
                : "Save Changes"
              : locale === "ar"
                ? "إنشاء الموقع"
                : "Create Location"}
        </Button>
      </div>
    </form>
  );
}
