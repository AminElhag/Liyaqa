"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Member, Gender } from "@/types/member";

// Zod schema for member form
// Names require at least one language (English OR Arabic)
const memberFormSchema = z.object({
  firstName: z
    .object({
      en: z.string().nullish(),
      ar: z.string().nullish(),
    })
    .refine(
      (data) => (data.en?.trim() || data.ar?.trim()),
      { message: "First name is required in at least one language | الاسم الأول مطلوب بلغة واحدة على الأقل" }
    ),
  lastName: z
    .object({
      en: z.string().nullish(),
      ar: z.string().nullish(),
    })
    .refine(
      (data) => (data.en?.trim() || data.ar?.trim()),
      { message: "Last name is required in at least one language | اسم العائلة مطلوب بلغة واحدة على الأقل" }
    ),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  address: z
    .object({
      en: z.string(),
      ar: z.string().nullish(),
    })
    .optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z
    .object({
      en: z.string(),
      ar: z.string().nullish(),
    })
    .optional(),
});

export type MemberFormData = z.infer<typeof memberFormSchema>;

interface MemberFormProps {
  member?: Member;
  onSubmit: (data: MemberFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function MemberForm({
  member,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: MemberFormProps) {
  const locale = useLocale();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      firstName: { en: member?.firstName?.en || "", ar: member?.firstName?.ar || "" },
      lastName: { en: member?.lastName?.en || "", ar: member?.lastName?.ar || "" },
      email: member?.email || "",
      phone: member?.phone || "",
      dateOfBirth: member?.dateOfBirth || "",
      gender: member?.gender,
      // Address from backend is AddressResponse, convert to form format
      address: member?.address
        ? { en: member.address.formatted || [member.address.street, member.address.city].filter(Boolean).join(", ") || "", ar: "" }
        : undefined,
      emergencyContactName: member?.emergencyContactName || "",
      emergencyContactPhone: member?.emergencyContactPhone || "",
      // Notes from backend is string, convert to form format
      notes: member?.notes ? { en: member.notes, ar: "" } : undefined,
    },
  });

  const texts = {
    title: locale === "ar" ? "معلومات العضو" : "Member Information",
    description:
      locale === "ar"
        ? "أدخل معلومات العضو الأساسية"
        : "Enter the member's basic information",
    firstNameEn: locale === "ar" ? "الاسم الأول (إنجليزي)" : "First Name (English)",
    firstNameAr: locale === "ar" ? "الاسم الأول (عربي)" : "First Name (Arabic)",
    lastNameEn: locale === "ar" ? "اسم العائلة (إنجليزي)" : "Last Name (English)",
    lastNameAr: locale === "ar" ? "اسم العائلة (عربي)" : "Last Name (Arabic)",
    nameRequiredHint:
      locale === "ar"
        ? "* مطلوب بلغة واحدة على الأقل"
        : "* Required in at least one language",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "رقم الهاتف" : "Phone Number",
    dateOfBirth: locale === "ar" ? "تاريخ الميلاد" : "Date of Birth",
    gender: locale === "ar" ? "الجنس" : "Gender",
    male: locale === "ar" ? "ذكر" : "Male",
    female: locale === "ar" ? "أنثى" : "Female",
    other: locale === "ar" ? "آخر" : "Other",
    preferNotToSay: locale === "ar" ? "أفضل عدم الإفصاح" : "Prefer not to say",
    selectGender: locale === "ar" ? "اختر الجنس" : "Select gender",
    addressEn: locale === "ar" ? "العنوان (إنجليزي)" : "Address (English)",
    addressAr: locale === "ar" ? "العنوان (عربي)" : "Address (Arabic)",
    emergencyTitle:
      locale === "ar" ? "معلومات الطوارئ" : "Emergency Information",
    emergencyName: locale === "ar" ? "اسم جهة الاتصال" : "Emergency Contact",
    emergencyPhone:
      locale === "ar" ? "هاتف جهة الاتصال" : "Emergency Phone",
    notesEn: locale === "ar" ? "ملاحظات (إنجليزي)" : "Notes (English)",
    notesAr: locale === "ar" ? "ملاحظات (عربي)" : "Notes (Arabic)",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    save: locale === "ar" ? "حفظ" : "Save",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
  };

  const watchGender = watch("gender");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.title}</CardTitle>
          <CardDescription>{texts.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name fields - hint about at least one language required */}
          <p className="text-sm text-muted-foreground">{texts.nameRequiredHint}</p>

          {/* First Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName.en">{texts.firstNameEn}</Label>
              <Input
                id="firstName.en"
                {...register("firstName.en")}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName.ar">{texts.firstNameAr}</Label>
              <Input
                id="firstName.ar"
                {...register("firstName.ar")}
                placeholder="يوحنا"
                dir="rtl"
              />
            </div>
          </div>
          {errors.firstName?.root && (
            <p className="text-sm text-destructive">
              {locale === "ar"
                ? "الاسم الأول مطلوب بلغة واحدة على الأقل"
                : "First name is required in at least one language"}
            </p>
          )}

          {/* Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lastName.en">{texts.lastNameEn}</Label>
              <Input
                id="lastName.en"
                {...register("lastName.en")}
                placeholder="Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName.ar">{texts.lastNameAr}</Label>
              <Input
                id="lastName.ar"
                {...register("lastName.ar")}
                placeholder="دو"
                dir="rtl"
              />
            </div>
          </div>
          {errors.lastName?.root && (
            <p className="text-sm text-destructive">
              {locale === "ar"
                ? "اسم العائلة مطلوب بلغة واحدة على الأقل"
                : "Last name is required in at least one language"}
            </p>
          )}

          {/* Contact fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{texts.email} *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{texts.phone} *</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+966 50 123 4567"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* Personal info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">{texts.dateOfBirth}</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
              />
            </div>
            <div className="space-y-2">
              <Label>{texts.gender}</Label>
              <Select
                value={watchGender}
                onValueChange={(value) =>
                  setValue("gender", value as Gender)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectGender} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">{texts.male}</SelectItem>
                  <SelectItem value="FEMALE">{texts.female}</SelectItem>
                  <SelectItem value="OTHER">{texts.other}</SelectItem>
                  <SelectItem value="PREFER_NOT_TO_SAY">{texts.preferNotToSay}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address.en">{texts.addressEn}</Label>
              <Input
                id="address.en"
                {...register("address.en")}
                placeholder="123 Main St, City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address.ar">{texts.addressAr}</Label>
              <Input
                id="address.ar"
                {...register("address.ar")}
                dir="rtl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.emergencyTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">{texts.emergencyName}</Label>
              <Input
                id="emergencyContactName"
                {...register("emergencyContactName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">
                {texts.emergencyPhone}
              </Label>
              <Input
                id="emergencyContactPhone"
                {...register("emergencyContactPhone")}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notes.en">{texts.notesEn}</Label>
              <Input id="notes.en" {...register("notes.en")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes.ar">{texts.notesAr}</Label>
              <Input id="notes.ar" {...register("notes.ar")} dir="rtl" />
            </div>
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
