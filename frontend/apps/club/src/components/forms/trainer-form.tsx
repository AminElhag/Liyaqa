"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import { Checkbox } from "@liyaqa/shared/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@liyaqa/shared/components/ui/popover";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { useUsers } from "@liyaqa/shared/queries/use-users";
import { useActiveClassCategories } from "@liyaqa/shared/queries/use-class-categories";
import { getLocalizedText } from "@liyaqa/shared/utils";
import type { Trainer, TrainerEmploymentType, TrainerType, CompensationModel, Gender } from "@liyaqa/shared/types/trainer";

const trainerFormSchema = z.object({
  accountMode: z.enum(["none", "link", "create"] as const),
  userId: z.string().optional().or(z.literal("")),
  // Account creation fields
  email: z.string().optional().or(z.literal("")),
  password: z.string().optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
  // Skills
  skillCategoryIds: z.array(z.string()).optional(),
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
  // PT-specific fields
  homeServiceAvailable: z.boolean().optional(),
  travelFeeAmount: z.coerce.number().min(0).optional(),
  travelFeeCurrency: z.string().optional(),
  travelRadiusKm: z.coerce.number().min(0).optional(),
  maxConcurrentClients: z.coerce.number().min(0).optional(),
}).superRefine((data, ctx) => {
  if (data.accountMode === "create") {
    if (!data.email) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Email is required", path: ["email"] });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid email address", path: ["email"] });
    }
    if (!data.password || data.password.length < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Password must be at least 8 characters", path: ["password"] });
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords do not match", path: ["confirmPassword"] });
    }
  }
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
  const [skillsOpen, setSkillsOpen] = useState(false);

  // Fetch users for the user selector (only when showUserField is true)
  const { data: usersData, isLoading: isLoadingUsers } = useUsers(
    { size: 100 },
    { enabled: showUserField }
  );

  // Fetch active class categories for skills picker
  const { data: categories } = useActiveClassCategories();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TrainerFormData>({
    resolver: zodResolver(trainerFormSchema),
    defaultValues: {
      accountMode: trainer?.userId ? "link" : "none",
      userId: trainer?.userId || "",
      email: "",
      password: "",
      confirmPassword: "",
      skillCategoryIds: trainer?.skills?.map((s) => s.categoryId) || [],
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
      // PT fields
      homeServiceAvailable: trainer?.homeServiceAvailable || false,
      travelFeeAmount: trainer?.travelFeeAmount || undefined,
      travelFeeCurrency: trainer?.travelFeeCurrency || "SAR",
      travelRadiusKm: trainer?.travelRadiusKm || undefined,
      maxConcurrentClients: trainer?.maxConcurrentClients || undefined,
    },
  });

  const accountMode = watch("accountMode");
  const selectedEmploymentType = watch("employmentType");
  const selectedTrainerType = watch("trainerType");
  const selectedCompensationModel = watch("compensationModel");
  const selectedGender = watch("gender");
  const selectedUserId = watch("userId");
  const homeServiceAvailable = watch("homeServiceAvailable");
  const selectedSkillIds = watch("skillCategoryIds") || [];

  const toggleSkill = (categoryId: string) => {
    const current = selectedSkillIds;
    const next = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];
    setValue("skillCategoryIds", next);
  };

  const texts = {
    // User / Account
    userAccount: locale === "ar" ? "حساب المستخدم" : "User Account",
    accountHint: locale === "ar" ? "اختر كيفية ربط حساب المدرب" : "Choose how to set up the trainer's account",
    noAccount: locale === "ar" ? "بدون حساب" : "No Account",
    noAccountDesc: locale === "ar" ? "مقاول خارجي — بدون تسجيل دخول" : "External contractor — no portal login",
    linkExisting: locale === "ar" ? "ربط حساب موجود" : "Link Existing User",
    linkExistingDesc: locale === "ar" ? "ربط بحساب مستخدم موجود" : "Link to an existing user account",
    createAccount: locale === "ar" ? "إنشاء حساب جديد" : "Create New Account",
    createAccountDesc: locale === "ar" ? "إنشاء حساب بريد وكلمة مرور" : "Create email & password account",
    trainerEmail: locale === "ar" ? "البريد الإلكتروني للمدرب" : "Trainer Email",
    trainerPassword: locale === "ar" ? "كلمة المرور" : "Password",
    confirmPassword: locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password",
    linkUser: locale === "ar" ? "ربط حساب مستخدم (اختياري)" : "Link User Account (Optional)",
    linkUserHint: locale === "ar" ? "اختياري — المدربون بدون حساب لن يتمكنوا من تسجيل الدخول" : "Optional — trainers without an account won't be able to log in",
    selectUser: locale === "ar" ? "اختر المستخدم" : "Select User",
    loadingUsers: locale === "ar" ? "جاري التحميل..." : "Loading users...",
    // Skills
    skills: locale === "ar" ? "المهارات التدريبية" : "Training Skills",
    skillsHint: locale === "ar" ? "اختر فئات الفصول التي يمكن للمدرب تدريسها" : "Select class categories this trainer can teach",
    selectSkills: locale === "ar" ? "اختر المهارات..." : "Select skills...",
    noCategories: locale === "ar" ? "لا توجد فئات" : "No categories available",
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
    additionalSpecs: locale === "ar" ? "تخصصات إضافية (نص حر)" : "Additional Specializations (free text)",
    specializationsHint: locale === "ar" ? "مفصولة بفواصل" : "Comma-separated",

    compensation: locale === "ar" ? "التعويضات" : "Compensation",
    hourlyRate: locale === "ar" ? "السعر بالساعة" : "Hourly Rate",
    ptSessionRate: locale === "ar" ? "سعر جلسة PT" : "PT Session Rate",
    compensationModel: locale === "ar" ? "نموذج التعويض" : "Compensation Model",

    // PT fields
    ptSettings: locale === "ar" ? "إعدادات التدريب الشخصي" : "Personal Training Settings",
    homeServiceAvailable: locale === "ar" ? "خدمة منزلية متاحة" : "Home Service Available",
    homeServiceHint: locale === "ar" ? "يمكن للمدرب تقديم جلسات في منزل العميل" : "Trainer can provide sessions at client's home",
    travelFee: locale === "ar" ? "رسوم التنقل" : "Travel Fee",
    travelFeeCurrency: locale === "ar" ? "العملة" : "Currency",
    travelRadius: locale === "ar" ? "نطاق التنقل (كم)" : "Travel Radius (km)",
    maxConcurrentClients: locale === "ar" ? "الحد الأقصى للعملاء المتزامنين" : "Max Concurrent Clients",

    notes: locale === "ar" ? "ملاحظات" : "Notes",
    notesEn: locale === "ar" ? "ملاحظات (بالإنجليزية)" : "Notes (English)",
    notesAr: locale === "ar" ? "ملاحظات (بالعربية)" : "Notes (Arabic)",

    save: locale === "ar" ? "حفظ" : "Save",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
    selectPlaceholder: locale === "ar" ? "اختر..." : "Select...",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* User Account Section */}
      {showUserField && (
        <Card>
          <CardHeader>
            <CardTitle>{texts.userAccount}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{texts.accountHint}</p>

            {/* Account mode toggle */}
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                { value: "none" as const, label: texts.noAccount, desc: texts.noAccountDesc },
                { value: "link" as const, label: texts.linkExisting, desc: texts.linkExistingDesc },
                { value: "create" as const, label: texts.createAccount, desc: texts.createAccountDesc },
              ]).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setValue("accountMode", option.value);
                    if (option.value !== "link") setValue("userId", "");
                    if (option.value !== "create") {
                      setValue("email", "");
                      setValue("password", "");
                      setValue("confirmPassword", "");
                    }
                  }}
                  className={`rounded-lg border-2 p-4 text-start transition-colors ${
                    accountMode === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{option.desc}</p>
                </button>
              ))}
            </div>

            {/* Link existing user */}
            {accountMode === "link" && (
              <div className="space-y-2">
                <Label>{texts.selectUser}</Label>
                <Select
                  value={selectedUserId || ""}
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
              </div>
            )}

            {/* Create new account */}
            {accountMode === "create" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{texts.trainerEmail}</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="trainer@example.com"
                    autoComplete="off"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">{texts.trainerPassword}</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register("password")}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{texts.confirmPassword}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...register("confirmPassword")}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
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

      {/* Classification + Skills */}
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

          {/* Skills multi-select */}
          <div className="space-y-2">
            <Label>{texts.skills}</Label>
            <p className="text-sm text-muted-foreground">{texts.skillsHint}</p>
            <Popover open={skillsOpen} onOpenChange={setSkillsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {selectedSkillIds.length > 0
                      ? `${selectedSkillIds.length} ${locale === "ar" ? "مختارة" : "selected"}`
                      : texts.selectSkills}
                  </span>
                  <ChevronDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                {!categories || categories.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">{texts.noCategories}</p>
                ) : (
                  <div className="max-h-[250px] overflow-y-auto p-2 space-y-1">
                    {categories.map((cat) => {
                      const isSelected = selectedSkillIds.includes(cat.id);
                      return (
                        <label
                          key={cat.id}
                          className="flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer hover:bg-muted transition-colors"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSkill(cat.id)}
                          />
                          {cat.colorCode && (
                            <span
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: cat.colorCode }}
                            />
                          )}
                          <span className="text-sm">
                            {getLocalizedText(cat.name, locale)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Selected category badges */}
            {selectedSkillIds.length > 0 && categories && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedSkillIds.map((id) => {
                  const cat = categories.find((c) => c.id === id);
                  if (!cat) return null;
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="gap-1 pe-1"
                      style={cat.colorCode ? {
                        backgroundColor: `${cat.colorCode}20`,
                        color: cat.colorCode,
                        borderColor: `${cat.colorCode}40`,
                      } : undefined}
                    >
                      {getLocalizedText(cat.name, locale)}
                      <button
                        type="button"
                        onClick={() => toggleSkill(id)}
                        className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Additional specializations (free text) */}
          <div className="space-y-2">
            <Label htmlFor="specializations">
              {texts.additionalSpecs}
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

      {/* Personal Training Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.ptSettings}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Home Service Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="homeServiceAvailable">{texts.homeServiceAvailable}</Label>
              <p className="text-sm text-muted-foreground">{texts.homeServiceHint}</p>
            </div>
            <Switch
              id="homeServiceAvailable"
              checked={homeServiceAvailable || false}
              onCheckedChange={(checked) => setValue("homeServiceAvailable", checked)}
            />
          </div>

          {/* Travel settings (shown when home service is enabled) */}
          {homeServiceAvailable && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="travelFeeAmount">{texts.travelFee}</Label>
                <Input
                  id="travelFeeAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("travelFeeAmount")}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="travelFeeCurrency">{texts.travelFeeCurrency}</Label>
                <Input
                  id="travelFeeCurrency"
                  {...register("travelFeeCurrency")}
                  placeholder="SAR"
                  defaultValue="SAR"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="travelRadiusKm">{texts.travelRadius}</Label>
                <Input
                  id="travelRadiusKm"
                  type="number"
                  min="0"
                  step="0.5"
                  {...register("travelRadiusKm")}
                  placeholder="25"
                />
              </div>
            </div>
          )}

          {/* Max Concurrent Clients */}
          <div className="max-w-xs space-y-2">
            <Label htmlFor="maxConcurrentClients">{texts.maxConcurrentClients}</Label>
            <Input
              id="maxConcurrentClients"
              type="number"
              min="0"
              {...register("maxConcurrentClients")}
              placeholder="10"
            />
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
