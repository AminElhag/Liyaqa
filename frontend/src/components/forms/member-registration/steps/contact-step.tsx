"use client";

import { UseFormReturn } from "react-hook-form";
import { useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RegistrationData } from "../schemas/registration-schema";

interface ContactStepProps {
  form: UseFormReturn<RegistrationData>;
}

export function ContactStep({ form }: ContactStepProps) {
  const locale = useLocale();
  const { register } = form;

  const texts = {
    addressTitle: locale === "ar" ? "العنوان" : "Address",
    addressDescription:
      locale === "ar"
        ? "أدخل عنوان العضو"
        : "Enter the member's address information",
    addressEn: locale === "ar" ? "العنوان (إنجليزي)" : "Address (EN)",
    addressAr: locale === "ar" ? "العنوان (عربي)" : "Address (AR)",
    emergencyTitle: locale === "ar" ? "جهة الاتصال للطوارئ" : "Emergency Contact",
    emergencyDescription:
      locale === "ar"
        ? "أدخل معلومات جهة الاتصال في حالات الطوارئ"
        : "Enter emergency contact information",
    emergencyName:
      locale === "ar" ? "اسم جهة الاتصال" : "Emergency Contact Name",
    emergencyPhone:
      locale === "ar" ? "هاتف جهة الاتصال" : "Emergency Contact Phone",
    notesTitle: locale === "ar" ? "ملاحظات التسجيل" : "Registration Notes",
    notesDescription:
      locale === "ar"
        ? "أي ملاحظات إضافية حول تسجيل العضو"
        : "Any additional notes about the member's registration",
    notesEn: locale === "ar" ? "ملاحظات (إنجليزي)" : "Notes (EN)",
    notesAr: locale === "ar" ? "ملاحظات (عربي)" : "Notes (AR)",
  };

  return (
    <div className="space-y-6">
      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.addressTitle}</CardTitle>
          <CardDescription>{texts.addressDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address.en">{texts.addressEn}</Label>
              <Textarea
                id="address.en"
                {...register("address.en")}
                placeholder="123 Main St, Riyadh"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address.ar">{texts.addressAr}</Label>
              <Textarea
                id="address.ar"
                {...register("address.ar")}
                placeholder="١٢٣ شارع الرئيسي، الرياض"
                dir="rtl"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.emergencyTitle}</CardTitle>
          <CardDescription>{texts.emergencyDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">{texts.emergencyName}</Label>
              <Input
                id="emergencyContactName"
                {...register("emergencyContactName")}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">
                {texts.emergencyPhone}
              </Label>
              <Input
                id="emergencyContactPhone"
                {...register("emergencyContactPhone")}
                placeholder="+966 50 987 6543"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Notes */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.notesTitle}</CardTitle>
          <CardDescription>{texts.notesDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registrationNotes.en">{texts.notesEn}</Label>
              <Textarea
                id="registrationNotes.en"
                {...register("registrationNotes.en")}
                placeholder="Any notes about the registration..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNotes.ar">{texts.notesAr}</Label>
              <Textarea
                id="registrationNotes.ar"
                {...register("registrationNotes.ar")}
                placeholder="أي ملاحظات..."
                dir="rtl"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
