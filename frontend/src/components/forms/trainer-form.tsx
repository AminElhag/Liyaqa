"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUsers } from "@/queries/use-users";
import { getLocalizedText } from "@/lib/utils";
import type { Trainer, TrainerEmploymentType, TrainerType, CompensationModel, Gender } from "@/types/trainer";

const trainerFormSchema = z.object({
  userId: z.string().min(1, "User is required"),
  // Basic Info
  displayName: z.object({
    en: z.string().min(2, "Name must be at least 2 characters").max(100).optional().or(z.literal("")),
    ar: z.string().max(100).optional().or(z.literal("")),
  }),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"] as const).optional(),
  // Profile
  bio: z.object({
    en: z.string().optional(),
    ar: z.string().optional(),
  }),
  profileImageUrl: z.string().url().optional().or(z.literal("")),
  experienceYears: z.coerce.number().min(0).optional(),
  employmentType: z.enum(["EMPLOYEE", "INDEPENDENT_CONTRACTOR", "FREELANCE"] as const),
  trainerType: z.enum(["PERSONAL_TRAINER", "GROUP_FITNESS", "SPECIALIST", "HYBRID"] as const),
  specializations: z.string().optional(), // Comma-separated
  hourlyRate: z.coerce.number().min(0).optional(),
  ptSessionRate: z.coerce.number().min(0).optional(),
  compensationModel: z.enum(["HOURLY", "PER_SESSION", "REVENUE_SHARE", "SALARY_PLUS_COMMISSION"] as const).optional(),
  phone: z.string().optional(),
  notes: z.object({
    en: z.string().optional(),
    ar: z.string().optional(),
  }),
});

export type TrainerFormData = z.infer<typeof trainerFormSchema>;

interface TrainerFormProps {
  trainer?: Trainer;
  onSubmit: (data: TrainerFormData) => void;
  isPending?: boolean;
  showUserField?: boolean;
}

const EMPLOYMENT_TYPES: { value: TrainerEmploymentType; labelEn: string; labelAr: string }[] = [
  { value: "EMPLOYEE", labelEn: "Employee", labelAr: "موظف" },
  { value: "INDEPENDENT_CONTRACTOR", labelEn: "Independent Contractor", labelAr: "مقاول مستقل" },
  { value: "FREELANCE", labelEn: "Freelance", labelAr: "عمل حر" },
];

const TRAINER_TYPES: { value: TrainerType; labelEn: string; labelAr: string }[] = [
  { value: "PERSONAL_TRAINER", labelEn: "Personal Trainer", labelAr: "مدرب شخصي" },
  { value: "GROUP_FITNESS", labelEn: "Group Fitness", labelAr: "لياقة جماعية" },
  { value: "SPECIALIST", labelEn: "Specialist", labelAr: "متخصص" },
  { value: "HYBRID", labelEn: "Hybrid", labelAr: "متعدد" },
];

const COMPENSATION_MODELS: { value: CompensationModel; labelEn: string; labelAr: string }[] = [
  { value: "HOURLY", labelEn: "Hourly", labelAr: "بالساعة" },
  { value: "PER_SESSION", labelEn: "Per Session", labelAr: "لكل جلسة" },
  { value: "REVENUE_SHARE", labelEn: "Revenue Share", labelAr: "حصة الإيرادات" },
  { value: "SALARY_PLUS_COMMISSION", labelEn: "Salary + Commission", labelAr: "راتب + عمولة" },
];

const GENDERS: { value: Gender; labelEn: string; labelAr: string }[] = [
  { value: "MALE", labelEn: "Male", labelAr: "ذكر" },
  { value: "FEMALE", labelEn: "Female", labelAr: "أنثى" },
  { value: "OTHER", labelEn: "Other", labelAr: "آخر" },
  { value: "PREFER_NOT_TO_SAY", labelEn: "Prefer not to say", labelAr: "أفضل عدم الإفصاح" },
];

export function TrainerForm({ trainer, onSubmit, isPending, showUserField = false }: TrainerFormProps) {
  const locale = useLocale();

  // Fetch users for the user selector (only when showUserField is true)
  const { data: usersData, isLoading: isLoadingUsers } = useUsers(
    { size: 100 },
    { enabled: showUserField }
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TrainerFormData>({
    resolver: zodResolver(trainerFormSchema),
    defaultValues: {
      userId: trainer?.userId || "",
      // Basic Info
      displayName: {
        en: trainer?.displayName?.en || "",
        ar: trainer?.displayName?.ar || "",
      },
      dateOfBirth: trainer?.dateOfBirth || "",
      gender: trainer?.gender || undefined,
      // Profile
      bio: {
        en: trainer?.bio?.en || "",
        ar: trainer?.bio?.ar || "",
      },
      profileImageUrl: trainer?.profileImageUrl || "",
      experienceYears: trainer?.experienceYears || undefined,
      employmentType: trainer?.employmentType || "INDEPENDENT_CONTRACTOR",
      trainerType: trainer?.trainerType || "GROUP_FITNESS",
      specializations: trainer?.specializations?.join(", ") || "",
      hourlyRate: trainer?.hourlyRate || undefined,
      ptSessionRate: trainer?.ptSessionRate || undefined,
      compensationModel: trainer?.compensationModel || undefined,
      phone: trainer?.phone || "",
      notes: {
        en: trainer?.notes?.en || "",
        ar: trainer?.notes?.ar || "",
      },
    },
  });

  const selectedEmploymentType = watch("employmentType");
  const selectedTrainerType = watch("trainerType");
  const selectedCompensationModel = watch("compensationModel");
  const selectedGender = watch("gender");
  const selectedUserId = watch("userId");

  const texts = {
    // User
    selectUser: locale === "ar" ? "اختر المستخدم" : "Select User",
    userRequired: locale === "ar" ? "المستخدم مطلوب" : "User is required",
    loadingUsers: locale === "ar" ? "جاري التحميل..." : "Loading users...",
    // Basic Info
    basicInfo: locale === "ar" ? "المعلومات الأساسية" : "Basic Information",
    displayNameEn: locale === "ar" ? "الاسم (بالإنجليزية)" : "Display Name (English)",
    displayNameAr: locale === "ar" ? "الاسم (بالعربية)" : "Display Name (Arabic)",
    dateOfBirth: locale === "ar" ? "تاريخ الميلاد" : "Date of Birth",
    gender: locale === "ar" ? "الجنس" : "Gender",
    // Profile
    profileInfo: locale === "ar" ? "معلومات الملف الشخصي" : "Profile Information",
    bioEn: locale === "ar" ? "السيرة الذاتية (بالإنجليزية)" : "Bio (English)",
    bioAr: locale === "ar" ? "السيرة الذاتية (بالعربية)" : "Bio (Arabic)",
    profileImage: locale === "ar" ? "رابط صورة الملف الشخصي" : "Profile Image URL",
    experienceYears: locale === "ar" ? "سنوات الخبرة" : "Years of Experience",
    phone: locale === "ar" ? "رقم الهاتف" : "Phone Number",

    classification: locale === "ar" ? "التصنيف" : "Classification",
    employmentType: locale === "ar" ? "نوع التوظيف" : "Employment Type",
    trainerType: locale === "ar" ? "نوع المدرب" : "Trainer Type",
    specializations: locale === "ar" ? "التخصصات" : "Specializations",
    specializationsHint: locale === "ar" ? "مفصولة بفواصل" : "Comma-separated",

    compensation: locale === "ar" ? "التعويضات" : "Compensation",
    hourlyRate: locale === "ar" ? "السعر بالساعة" : "Hourly Rate",
    ptSessionRate: locale === "ar" ? "سعر جلسة PT" : "PT Session Rate",
    compensationModel: locale === "ar" ? "نموذج التعويض" : "Compensation Model",

    notes: locale === "ar" ? "ملاحظات" : "Notes",
    notesEn: locale === "ar" ? "ملاحظات (بالإنجليزية)" : "Notes (English)",
    notesAr: locale === "ar" ? "ملاحظات (بالعربية)" : "Notes (Arabic)",

    save: locale === "ar" ? "حفظ" : "Save",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
    selectPlaceholder: locale === "ar" ? "اختر..." : "Select...",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* User Selection (only shown when creating a new trainer) */}
      {showUserField && (
        <Card>
          <CardHeader>
            <CardTitle>{texts.selectUser} *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Select
                value={selectedUserId}
                onValueChange={(value) => setValue("userId", value)}
                disabled={isLoadingUsers}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingUsers ? texts.loadingUsers : texts.selectPlaceholder
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {usersData?.content?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {getLocalizedText(user.displayName, locale) || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && (
                <p className="text-sm text-destructive">{texts.userRequired}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.basicInfo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayNameEn">{texts.displayNameEn}</Label>
              <Input
                id="displayNameEn"
                {...register("displayName.en")}
                placeholder="John Doe"
              />
              {errors.displayName?.en && (
                <p className="text-sm text-destructive">{errors.displayName.en.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayNameAr">{texts.displayNameAr}</Label>
              <Input
                id="displayNameAr"
                {...register("displayName.ar")}
                placeholder="جون دو"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                value={selectedGender || ""}
                onValueChange={(value) => setValue("gender", value as Gender)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {locale === "ar" ? g.labelAr : g.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.profileInfo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bioEn">{texts.bioEn}</Label>
              <Textarea
                id="bioEn"
                {...register("bio.en")}
                placeholder="Professional bio..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bioAr">{texts.bioAr}</Label>
              <Textarea
                id="bioAr"
                {...register("bio.ar")}
                placeholder="السيرة الذاتية..."
                rows={3}
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="profileImageUrl">{texts.profileImage}</Label>
              <Input
                id="profileImageUrl"
                {...register("profileImageUrl")}
                placeholder="https://..."
              />
              {errors.profileImageUrl && (
                <p className="text-sm text-destructive">{errors.profileImageUrl.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceYears">{texts.experienceYears}</Label>
              <Input
                id="experienceYears"
                type="number"
                min="0"
                {...register("experienceYears")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{texts.phone}</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+966..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classification */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.classification}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{texts.employmentType}</Label>
              <Select
                value={selectedEmploymentType}
                onValueChange={(value) => setValue("employmentType", value as TrainerEmploymentType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {locale === "ar" ? type.labelAr : type.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{texts.trainerType}</Label>
              <Select
                value={selectedTrainerType}
                onValueChange={(value) => setValue("trainerType", value as TrainerType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {TRAINER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {locale === "ar" ? type.labelAr : type.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specializations">
              {texts.specializations}
              <span className="text-sm text-muted-foreground ms-2">({texts.specializationsHint})</span>
            </Label>
            <Input
              id="specializations"
              {...register("specializations")}
              placeholder="Yoga, Pilates, CrossFit..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Compensation */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.compensation}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">{texts.hourlyRate}</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                {...register("hourlyRate")}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptSessionRate">{texts.ptSessionRate}</Label>
              <Input
                id="ptSessionRate"
                type="number"
                min="0"
                step="0.01"
                {...register("ptSessionRate")}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>{texts.compensationModel}</Label>
              <Select
                value={selectedCompensationModel || ""}
                onValueChange={(value) => setValue("compensationModel", value as CompensationModel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {COMPENSATION_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {locale === "ar" ? model.labelAr : model.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.notes}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="notesEn">{texts.notesEn}</Label>
              <Textarea
                id="notesEn"
                {...register("notes.en")}
                placeholder="Internal notes..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notesAr">{texts.notesAr}</Label>
              <Textarea
                id="notesAr"
                {...register("notes.ar")}
                placeholder="ملاحظات داخلية..."
                rows={3}
                dir="rtl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? texts.saving : texts.save}
        </Button>
      </div>
    </form>
  );
}
