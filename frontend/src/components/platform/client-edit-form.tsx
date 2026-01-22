"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { Client } from "@/types/platform";
import type { OrganizationType } from "@/types/organization";

// Form validation schema
const editClientSchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().optional(),
  tradeNameEn: z.string().optional(),
  tradeNameAr: z.string().optional(),
  organizationType: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  vatRegistrationNumber: z.string().optional(),
  commercialRegistrationNumber: z.string().optional(),
});

type EditClientFormValues = z.infer<typeof editClientSchema>;

interface ClientEditFormProps {
  client: Client;
  onSubmit: (data: EditClientFormValues) => void;
  isLoading?: boolean;
}

const ORG_TYPES: { value: OrganizationType; labelEn: string; labelAr: string }[] = [
  { value: "LLC", labelEn: "LLC", labelAr: "ذ.م.م" },
  { value: "SOLE_PROPRIETORSHIP", labelEn: "Sole Proprietorship", labelAr: "مؤسسة فردية" },
  { value: "PARTNERSHIP", labelEn: "Partnership", labelAr: "شراكة" },
  { value: "CORPORATION", labelEn: "Corporation", labelAr: "شركة مساهمة" },
  { value: "OTHER", labelEn: "Other", labelAr: "أخرى" },
];

export function ClientEditForm({ client, onSubmit, isLoading }: ClientEditFormProps) {
  const locale = useLocale();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditClientFormValues>({
    resolver: zodResolver(editClientSchema),
    defaultValues: {
      nameEn: client.name.en || "",
      nameAr: client.name.ar || "",
      tradeNameEn: client.tradeName?.en || "",
      tradeNameAr: client.tradeName?.ar || "",
      organizationType: client.organizationType || "",
      email: client.email || "",
      phone: client.phone || "",
      website: client.website || "",
      vatRegistrationNumber: client.vatRegistrationNumber || "",
      commercialRegistrationNumber: client.commercialRegistrationNumber || "",
    },
  });

  const texts = {
    organizationDetails: locale === "ar" ? "تفاصيل المنظمة" : "Organization Details",
    organizationDesc:
      locale === "ar"
        ? "تحديث المعلومات الأساسية للعميل"
        : "Update basic client information",
    nameEn: locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)",
    nameAr: locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)",
    tradeNameEn: locale === "ar" ? "الاسم التجاري (إنجليزي)" : "Trade Name (English)",
    tradeNameAr: locale === "ar" ? "الاسم التجاري (عربي)" : "Trade Name (Arabic)",
    type: locale === "ar" ? "النوع" : "Type",
    selectType: locale === "ar" ? "اختر النوع" : "Select type",
    contactInfo: locale === "ar" ? "معلومات الاتصال" : "Contact Information",
    contactDesc:
      locale === "ar"
        ? "تحديث معلومات الاتصال"
        : "Update contact details",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    website: locale === "ar" ? "الموقع الإلكتروني" : "Website",
    registrationInfo: locale === "ar" ? "معلومات التسجيل" : "Registration Info",
    registrationDesc:
      locale === "ar"
        ? "الأرقام التسجيلية والضريبية"
        : "Tax and registration numbers",
    vatNumber: locale === "ar" ? "رقم السجل الضريبي" : "VAT Registration Number",
    crNumber: locale === "ar" ? "رقم السجل التجاري" : "Commercial Registration Number",
    submit: locale === "ar" ? "حفظ التغييرات" : "Save Changes",
    submitting: locale === "ar" ? "جاري الحفظ..." : "Saving...",
  };

  const watchOrgType = watch("organizationType");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {texts.organizationDetails}
          </CardTitle>
          <CardDescription>{texts.organizationDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameEn">{texts.nameEn} *</Label>
              <Input id="nameEn" {...register("nameEn")} />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">{texts.nameAr}</Label>
              <Input id="nameAr" {...register("nameAr")} dir="rtl" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tradeNameEn">{texts.tradeNameEn}</Label>
              <Input id="tradeNameEn" {...register("tradeNameEn")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tradeNameAr">{texts.tradeNameAr}</Label>
              <Input id="tradeNameAr" {...register("tradeNameAr")} dir="rtl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{texts.type}</Label>
            <Select
              value={watchOrgType}
              onValueChange={(value) => setValue("organizationType", value)}
            >
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
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.contactInfo}</CardTitle>
          <CardDescription>{texts.contactDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{texts.email}</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{texts.phone}</Label>
              <Input id="phone" type="tel" {...register("phone")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">{texts.website}</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://"
              {...register("website")}
            />
            {errors.website && (
              <p className="text-sm text-destructive">{errors.website.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registration Info */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.registrationInfo}</CardTitle>
          <CardDescription>{texts.registrationDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vatRegistrationNumber">{texts.vatNumber}</Label>
              <Input id="vatRegistrationNumber" {...register("vatRegistrationNumber")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commercialRegistrationNumber">{texts.crNumber}</Label>
              <Input
                id="commercialRegistrationNumber"
                {...register("commercialRegistrationNumber")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? texts.submitting : texts.submit}
        </Button>
      </div>
    </form>
  );
}

export type { EditClientFormValues };
