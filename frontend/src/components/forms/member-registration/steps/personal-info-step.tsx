"use client";

import { UseFormReturn } from "react-hook-form";
import { useLocale } from "next-intl";
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
import type { RegistrationData } from "../schemas/registration-schema";

interface PersonalInfoStepProps {
  form: UseFormReturn<RegistrationData>;
}

export function PersonalInfoStep({ form }: PersonalInfoStepProps) {
  const locale = useLocale();
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const texts = {
    title: locale === "ar" ? "المعلومات الشخصية" : "Personal Information",
    description:
      locale === "ar"
        ? "أدخل المعلومات الأساسية للعضو"
        : "Enter the member's basic information",
    nameRequiredHint:
      locale === "ar"
        ? "* الاسم مطلوب بلغة واحدة على الأقل"
        : "* Name required in at least one language",
    firstNameEn: locale === "ar" ? "الاسم الأول (إنجليزي)" : "First Name (EN)",
    firstNameAr: locale === "ar" ? "الاسم الأول (عربي)" : "First Name (AR)",
    lastNameEn: locale === "ar" ? "اسم العائلة (إنجليزي)" : "Last Name (EN)",
    lastNameAr: locale === "ar" ? "اسم العائلة (عربي)" : "Last Name (AR)",
    firstNameError:
      locale === "ar"
        ? "الاسم الأول مطلوب بلغة واحدة على الأقل"
        : "First name is required in at least one language",
    lastNameError:
      locale === "ar"
        ? "اسم العائلة مطلوب بلغة واحدة على الأقل"
        : "Last name is required in at least one language",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "رقم الهاتف" : "Phone Number",
    dateOfBirth: locale === "ar" ? "تاريخ الميلاد" : "Date of Birth",
    gender: locale === "ar" ? "الجنس" : "Gender",
    male: locale === "ar" ? "ذكر" : "Male",
    female: locale === "ar" ? "أنثى" : "Female",
    selectGender: locale === "ar" ? "اختر الجنس" : "Select gender",
    nationality: locale === "ar" ? "الجنسية" : "Nationality",
    nationalId: locale === "ar" ? "رقم الهوية" : "National ID",
    preferredLanguage: locale === "ar" ? "اللغة المفضلة" : "Preferred Language",
    english: locale === "ar" ? "الإنجليزية" : "English",
    arabic: locale === "ar" ? "العربية" : "Arabic",
    selectLanguage: locale === "ar" ? "اختر اللغة" : "Select language",
  };

  const watchGender = watch("gender");
  const watchLanguage = watch("preferredLanguage");

  return (
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
          <p className="text-sm text-destructive">{texts.firstNameError}</p>
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
          <p className="text-sm text-destructive">{texts.lastNameError}</p>
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
              <p className="text-sm text-destructive">{errors.email.message}</p>
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
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* Personal info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">{texts.dateOfBirth}</Label>
            <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
          </div>
          <div className="space-y-2">
            <Label>{texts.gender}</Label>
            <Select
              value={watchGender}
              onValueChange={(value) =>
                setValue("gender", value as "MALE" | "FEMALE")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={texts.selectGender} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">{texts.male}</SelectItem>
                <SelectItem value="FEMALE">{texts.female}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Nationality & National ID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nationality">{texts.nationality}</Label>
            <Input
              id="nationality"
              {...register("nationality")}
              placeholder="Saudi Arabia"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationalId">{texts.nationalId}</Label>
            <Input
              id="nationalId"
              {...register("nationalId")}
              placeholder="1234567890"
            />
          </div>
        </div>

        {/* Preferred Language */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{texts.preferredLanguage}</Label>
            <Select
              value={watchLanguage}
              onValueChange={(value) =>
                setValue("preferredLanguage", value as "EN" | "AR")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={texts.selectLanguage} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EN">{texts.english}</SelectItem>
                <SelectItem value="AR">{texts.arabic}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
