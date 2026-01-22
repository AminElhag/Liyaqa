"use client";

import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useCreateMember } from "@/queries/use-members";
import type { Member, Gender, Language } from "@/types/member";

const quickCreateSchema = z
  .object({
    firstNameEn: z.string().optional(),
    firstNameAr: z.string().optional(),
    lastNameEn: z.string().optional(),
    lastNameAr: z.string().optional(),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone is required"),
    gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
    dateOfBirth: z.string().optional(),
    preferredLanguage: z.enum(["EN", "AR"]).optional(),
  })
  .refine(
    (data) =>
      (data.firstNameEn && data.firstNameEn.length > 0) ||
      (data.firstNameAr && data.firstNameAr.length > 0),
    {
      message: "First name is required (English or Arabic)",
      path: ["firstNameEn"],
    }
  )
  .refine(
    (data) =>
      (data.lastNameEn && data.lastNameEn.length > 0) ||
      (data.lastNameAr && data.lastNameAr.length > 0),
    {
      message: "Last name is required (English or Arabic)",
      path: ["lastNameEn"],
    }
  );

type QuickCreateFormData = z.infer<typeof quickCreateSchema>;

interface QuickCreateCustomerProps {
  onSuccess: (member: Member) => void;
  onCancel: () => void;
}

export function QuickCreateCustomer({
  onSuccess,
  onCancel,
}: QuickCreateCustomerProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const createMember = useCreateMember();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuickCreateFormData>({
    resolver: zodResolver(quickCreateSchema),
    defaultValues: {
      preferredLanguage: locale === "ar" ? "AR" : "EN",
    },
  });

  const texts = {
    firstNameEn: locale === "ar" ? "الاسم الأول (إنجليزي)" : "First Name (EN)",
    firstNameAr: locale === "ar" ? "الاسم الأول (عربي)" : "First Name (AR)",
    lastNameEn: locale === "ar" ? "اسم العائلة (إنجليزي)" : "Last Name (EN)",
    lastNameAr: locale === "ar" ? "اسم العائلة (عربي)" : "Last Name (AR)",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "رقم الهاتف" : "Phone",
    gender: locale === "ar" ? "الجنس" : "Gender",
    dateOfBirth: locale === "ar" ? "تاريخ الميلاد" : "Date of Birth",
    preferredLanguage: locale === "ar" ? "اللغة المفضلة" : "Preferred Language",
    male: locale === "ar" ? "ذكر" : "Male",
    female: locale === "ar" ? "أنثى" : "Female",
    other: locale === "ar" ? "آخر" : "Other",
    preferNotToSay: locale === "ar" ? "أفضل عدم الإجابة" : "Prefer not to say",
    english: locale === "ar" ? "الإنجليزية" : "English",
    arabic: locale === "ar" ? "العربية" : "Arabic",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    createAndSelect: locale === "ar" ? "إنشاء واختيار" : "Create & Select",
    creating: locale === "ar" ? "جاري الإنشاء..." : "Creating...",
    successTitle: locale === "ar" ? "تم إنشاء العميل" : "Customer created",
    successDesc:
      locale === "ar"
        ? "تم إنشاء العميل بنجاح"
        : "Customer was created successfully",
    errorTitle: locale === "ar" ? "فشل الإنشاء" : "Creation failed",
    errorDesc:
      locale === "ar"
        ? "فشل في إنشاء العميل"
        : "Failed to create customer",
    required: locale === "ar" ? "مطلوب" : "Required",
    optional: locale === "ar" ? "اختياري" : "Optional",
  };

  const onSubmit = async (data: QuickCreateFormData) => {
    try {
      const member = await createMember.mutateAsync({
        firstName: {
          en: data.firstNameEn || undefined,
          ar: data.firstNameAr || undefined,
        },
        lastName: {
          en: data.lastNameEn || undefined,
          ar: data.lastNameAr || undefined,
        },
        email: data.email,
        phone: data.phone,
        gender: data.gender as Gender,
        dateOfBirth: data.dateOfBirth || undefined,
        preferredLanguage: data.preferredLanguage as Language,
      });

      toast({
        title: texts.successTitle,
        description: texts.successDesc,
      });

      onSuccess(member);
    } catch {
      toast({
        title: texts.errorTitle,
        description: texts.errorDesc,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name Fields - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstNameEn" className="text-sm font-medium">
            {texts.firstNameEn} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstNameEn"
            {...register("firstNameEn")}
            className="h-10"
            placeholder="John"
          />
          {errors.firstNameEn && (
            <p className="text-xs text-red-500">{errors.firstNameEn.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstNameAr" className="text-sm font-medium">
            {texts.firstNameAr}
          </Label>
          <Input
            id="firstNameAr"
            {...register("firstNameAr")}
            className="h-10"
            placeholder="يوحنا"
            dir="rtl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastNameEn" className="text-sm font-medium">
            {texts.lastNameEn} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastNameEn"
            {...register("lastNameEn")}
            className="h-10"
            placeholder="Doe"
          />
          {errors.lastNameEn && (
            <p className="text-xs text-red-500">{errors.lastNameEn.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastNameAr" className="text-sm font-medium">
            {texts.lastNameAr}
          </Label>
          <Input
            id="lastNameAr"
            {...register("lastNameAr")}
            className="h-10"
            placeholder="دو"
            dir="rtl"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          {texts.email} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          className="h-10"
          placeholder="john.doe@example.com"
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium">
          {texts.phone} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          {...register("phone")}
          className="h-10"
          placeholder="+966 5XXXXXXXX"
        />
        {errors.phone && (
          <p className="text-xs text-red-500">{errors.phone.message}</p>
        )}
      </div>

      {/* Optional Fields - Collapsible or smaller */}
      <div className="grid grid-cols-2 gap-4">
        {/* Gender */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-neutral-600">
            {texts.gender}
          </Label>
          <Select
            value={watch("gender") || ""}
            onValueChange={(value) =>
              setValue("gender", value as QuickCreateFormData["gender"])
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder={texts.optional} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">{texts.male}</SelectItem>
              <SelectItem value="FEMALE">{texts.female}</SelectItem>
              <SelectItem value="OTHER">{texts.other}</SelectItem>
              <SelectItem value="PREFER_NOT_TO_SAY">
                {texts.preferNotToSay}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth" className="text-sm font-medium text-neutral-600">
            {texts.dateOfBirth}
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            {...register("dateOfBirth")}
            className="h-10"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-neutral-100">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-11"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {texts.cancel}
        </Button>
        <Button
          type="submit"
          className="flex-1 h-11 bg-teal-600 hover:bg-teal-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              {texts.creating}
            </>
          ) : (
            texts.createAndSelect
          )}
        </Button>
      </div>
    </form>
  );
}
