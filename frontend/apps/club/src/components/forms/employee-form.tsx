"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
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
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import { useActiveDepartments } from "@liyaqa/shared/queries/use-departments";
import { useActiveJobTitles } from "@liyaqa/shared/queries/use-job-titles";
import { useUsers } from "@liyaqa/shared/queries/use-users";
import { getLocalizedText } from "@liyaqa/shared/utils";
import type { Employee, EmploymentType, Gender, SalaryFrequency } from "@liyaqa/shared/types/employee";

const employeeFormSchema = z.object({
  // User account fields
  createNewUser: z.boolean().default(false),
  userId: z.string().optional(),
  newUserEmail: z.string().optional(),
  newUserPassword: z.string().optional(),
  newUserPasswordConfirm: z.string().optional(),
  newUserDisplayNameEn: z.string().optional(),
  newUserDisplayNameAr: z.string().optional(),
  newUserRole: z.enum(["STAFF", "TRAINER", "CLUB_ADMIN"]).optional(),

  organizationId: z.string().min(1, "Organization ID is required"),
  firstName: z.object({
    en: z.string().min(1, "English first name is required"),
    ar: z.string().nullish(),
  }),
  lastName: z.object({
    en: z.string().min(1, "English last name is required"),
    ar: z.string().nullish(),
  }),
  hireDate: z.string().min(1, "Hire date is required"),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "SEASONAL"]),
  email: z.string().email("Invalid email").nullish().or(z.literal("")),
  phone: z.string().nullish(),
  dateOfBirth: z.string().nullish(),
  gender: z.enum(["MALE", "FEMALE"]).nullish(),
  address: z.object({
    street: z.string().nullish(),
    city: z.string().nullish(),
    state: z.string().nullish(),
    postalCode: z.string().nullish(),
    country: z.string().nullish(),
  }).nullish(),
  departmentId: z.string().nullish(),
  jobTitleId: z.string().nullish(),
  emergencyContactName: z.string().nullish(),
  emergencyContactPhone: z.string().nullish(),
  emergencyContactRelationship: z.string().nullish(),
  salaryAmount: z.number().min(0).nullish(),
  salaryCurrency: z.string().nullish(),
  salaryFrequency: z.enum(["HOURLY", "DAILY", "WEEKLY", "BI_WEEKLY", "MONTHLY", "ANNUALLY"]).nullish(),
  profileImageUrl: z.string().nullish(),
  notes: z.object({
    en: z.string().nullish(),
    ar: z.string().nullish(),
  }).nullish(),
}).superRefine((data, ctx) => {
  if (data.createNewUser) {
    // Validate new user fields
    if (!data.newUserEmail || data.newUserEmail.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["newUserEmail"], message: "Email is required" });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.newUserEmail)) {
      ctx.addIssue({ code: "custom", path: ["newUserEmail"], message: "Invalid email format" });
    }
    if (!data.newUserPassword || data.newUserPassword.length < 8) {
      ctx.addIssue({ code: "custom", path: ["newUserPassword"], message: "Password must be at least 8 characters" });
    }
    if (data.newUserPassword !== data.newUserPasswordConfirm) {
      ctx.addIssue({ code: "custom", path: ["newUserPasswordConfirm"], message: "Passwords do not match" });
    }
    if (!data.newUserDisplayNameEn || data.newUserDisplayNameEn.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["newUserDisplayNameEn"], message: "Display name is required" });
    }
    if (!data.newUserRole) {
      ctx.addIssue({ code: "custom", path: ["newUserRole"], message: "Role is required" });
    }
  } else {
    // Validate existing user selection
    if (!data.userId || data.userId.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["userId"], message: "Please select a user" });
    }
  }
});

export type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  employee?: Employee;
  defaultUserId?: string;
  defaultOrganizationId?: string;
  onSubmit: (data: EmployeeFormData) => void;
  isPending?: boolean;
  isEditMode?: boolean;
}

const employmentTypes: { value: EmploymentType; labelEn: string; labelAr: string }[] = [
  { value: "FULL_TIME", labelEn: "Full Time", labelAr: "دوام كامل" },
  { value: "PART_TIME", labelEn: "Part Time", labelAr: "دوام جزئي" },
  { value: "CONTRACT", labelEn: "Contract", labelAr: "عقد" },
  { value: "INTERN", labelEn: "Intern", labelAr: "متدرب" },
  { value: "SEASONAL", labelEn: "Seasonal", labelAr: "موسمي" },
];

const genderOptions: { value: Gender; labelEn: string; labelAr: string }[] = [
  { value: "MALE", labelEn: "Male", labelAr: "ذكر" },
  { value: "FEMALE", labelEn: "Female", labelAr: "أنثى" },
];

const salaryFrequencies: { value: SalaryFrequency; labelEn: string; labelAr: string }[] = [
  { value: "HOURLY", labelEn: "Hourly", labelAr: "بالساعة" },
  { value: "DAILY", labelEn: "Daily", labelAr: "يومي" },
  { value: "WEEKLY", labelEn: "Weekly", labelAr: "أسبوعي" },
  { value: "BI_WEEKLY", labelEn: "Bi-Weekly", labelAr: "نصف شهري" },
  { value: "MONTHLY", labelEn: "Monthly", labelAr: "شهري" },
  { value: "ANNUALLY", labelEn: "Annually", labelAr: "سنوي" },
];

type NewUserRole = "STAFF" | "TRAINER" | "CLUB_ADMIN";

const roleOptions: { value: NewUserRole; labelEn: string; labelAr: string }[] = [
  { value: "STAFF", labelEn: "Staff", labelAr: "موظف" },
  { value: "TRAINER", labelEn: "Trainer", labelAr: "مدرب" },
  { value: "CLUB_ADMIN", labelEn: "Club Admin", labelAr: "مدير النادي" },
];

export function EmployeeForm({
  employee,
  defaultUserId,
  defaultOrganizationId,
  onSubmit,
  isPending,
  isEditMode = false,
}: EmployeeFormProps) {
  const locale = useLocale();
  const { data: departments, isLoading: deptsLoading } = useActiveDepartments();
  const { data: jobTitles, isLoading: jobTitlesLoading } = useActiveJobTitles();
  const { data: usersData, isLoading: usersLoading } = useUsers(
    { active: true, size: 100 },
    { enabled: !isEditMode }
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      createNewUser: false,
      userId: employee?.userId || defaultUserId || "",
      newUserEmail: "",
      newUserPassword: "",
      newUserPasswordConfirm: "",
      newUserDisplayNameEn: "",
      newUserDisplayNameAr: "",
      newUserRole: "STAFF",
      organizationId: employee?.organizationId || defaultOrganizationId || "",
      firstName: {
        en: employee?.firstName.en || "",
        ar: employee?.firstName.ar || "",
      },
      lastName: {
        en: employee?.lastName.en || "",
        ar: employee?.lastName.ar || "",
      },
      hireDate: employee?.hireDate || "",
      employmentType: employee?.employmentType || "FULL_TIME",
      email: employee?.email || "",
      phone: employee?.phone || "",
      dateOfBirth: employee?.dateOfBirth || "",
      gender: employee?.gender || undefined,
      address: {
        street: employee?.address?.street || "",
        city: employee?.address?.city || "",
        state: employee?.address?.state || "",
        postalCode: employee?.address?.postalCode || "",
        country: employee?.address?.country || "",
      },
      departmentId: employee?.departmentId || "",
      jobTitleId: employee?.jobTitleId || "",
      emergencyContactName: employee?.emergencyContact?.name || "",
      emergencyContactPhone: employee?.emergencyContact?.phone || "",
      emergencyContactRelationship: employee?.emergencyContact?.relationship || "",
      salaryAmount: employee?.salaryAmount || undefined,
      salaryCurrency: employee?.salaryCurrency || "SAR",
      salaryFrequency: employee?.salaryFrequency || undefined,
      profileImageUrl: employee?.profileImageUrl || "",
      notes: {
        en: employee?.notes?.en || "",
        ar: employee?.notes?.ar || "",
      },
    },
  });

  const createNewUser = watch("createNewUser");
  const selectedUserId = watch("userId");
  const selectedNewUserRole = watch("newUserRole");
  const selectedDeptId = watch("departmentId");
  const selectedJobTitleId = watch("jobTitleId");
  const selectedEmploymentType = watch("employmentType");
  const selectedGender = watch("gender");
  const selectedSalaryFrequency = watch("salaryFrequency");

  // Get available users (filter out users who might already have employee records)
  const availableUsers = usersData?.content || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* User Account Section (Create Mode Only) */}
      {!isEditMode && (
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "ar" ? "حساب المستخدم" : "User Account"} *
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toggle between existing/new user */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Switch
                id="createNewUser"
                checked={createNewUser}
                onCheckedChange={(checked) => setValue("createNewUser", checked)}
              />
              <Label htmlFor="createNewUser">
                {locale === "ar" ? "إنشاء حساب مستخدم جديد" : "Create new user account"}
              </Label>
            </div>

            {createNewUser ? (
              /* NEW USER FIELDS */
              <div className="space-y-4 pt-4 border-t">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newUserEmail">
                      {locale === "ar" ? "البريد الإلكتروني" : "Email"} *
                    </Label>
                    <Input
                      id="newUserEmail"
                      type="email"
                      {...register("newUserEmail")}
                      placeholder="user@example.com"
                    />
                    {errors.newUserEmail && (
                      <p className="text-sm text-destructive">{errors.newUserEmail.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserRole">
                      {locale === "ar" ? "الدور" : "Role"} *
                    </Label>
                    <Select
                      value={selectedNewUserRole || "STAFF"}
                      onValueChange={(value) => setValue("newUserRole", value as NewUserRole)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {locale === "ar" ? role.labelAr : role.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.newUserRole && (
                      <p className="text-sm text-destructive">{errors.newUserRole.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newUserPassword">
                      {locale === "ar" ? "كلمة المرور" : "Password"} *
                    </Label>
                    <Input
                      id="newUserPassword"
                      type="password"
                      {...register("newUserPassword")}
                      placeholder="********"
                    />
                    {errors.newUserPassword && (
                      <p className="text-sm text-destructive">{errors.newUserPassword.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserPasswordConfirm">
                      {locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"} *
                    </Label>
                    <Input
                      id="newUserPasswordConfirm"
                      type="password"
                      {...register("newUserPasswordConfirm")}
                      placeholder="********"
                    />
                    {errors.newUserPasswordConfirm && (
                      <p className="text-sm text-destructive">{errors.newUserPasswordConfirm.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newUserDisplayNameEn">
                      {locale === "ar" ? "اسم العرض (إنجليزي)" : "Display Name (EN)"} *
                    </Label>
                    <Input
                      id="newUserDisplayNameEn"
                      {...register("newUserDisplayNameEn")}
                      placeholder="John Doe"
                    />
                    {errors.newUserDisplayNameEn && (
                      <p className="text-sm text-destructive">{errors.newUserDisplayNameEn.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserDisplayNameAr">
                      {locale === "ar" ? "اسم العرض (عربي)" : "Display Name (AR)"}
                    </Label>
                    <Input
                      id="newUserDisplayNameAr"
                      {...register("newUserDisplayNameAr")}
                      placeholder="جون دو"
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* EXISTING USER DROPDOWN */
              <div className="space-y-2">
                <Label htmlFor="userId">
                  {locale === "ar" ? "اختر المستخدم" : "Select User"} *
                </Label>
                {usersLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedUserId || ""}
                    onValueChange={(value) => setValue("userId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={locale === "ar" ? "اختر مستخدم لربطه بالموظف" : "Select a user to link to this employee"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          {locale === "ar" ? "لا يوجد مستخدمين متاحين" : "No users available"}
                        </div>
                      ) : (
                        availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.displayName?.en || user.email} ({user.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                {errors.userId && (
                  <p className="text-sm text-destructive">{errors.userId.message}</p>
                )}
              </div>
            )}

            {/* Organization ID hidden field */}
            <input type="hidden" {...register("organizationId")} />
          </CardContent>
        </Card>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "المعلومات الشخصية" : "Personal Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName.en">
                {locale === "ar" ? "الاسم الأول (إنجليزي)" : "First Name (English)"} *
              </Label>
              <Input
                id="firstName.en"
                {...register("firstName.en")}
                placeholder="John"
              />
              {errors.firstName?.en && (
                <p className="text-sm text-destructive">{errors.firstName.en.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName.ar">
                {locale === "ar" ? "الاسم الأول (عربي)" : "First Name (Arabic)"}
              </Label>
              <Input
                id="firstName.ar"
                {...register("firstName.ar")}
                placeholder="جون"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lastName.en">
                {locale === "ar" ? "اسم العائلة (إنجليزي)" : "Last Name (English)"} *
              </Label>
              <Input
                id="lastName.en"
                {...register("lastName.en")}
                placeholder="Doe"
              />
              {errors.lastName?.en && (
                <p className="text-sm text-destructive">{errors.lastName.en.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName.ar">
                {locale === "ar" ? "اسم العائلة (عربي)" : "Last Name (Arabic)"}
              </Label>
              <Input
                id="lastName.ar"
                {...register("lastName.ar")}
                placeholder="دو"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                {locale === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">
                {locale === "ar" ? "الجنس" : "Gender"}
              </Label>
              <Select
                value={selectedGender || ""}
                onValueChange={(value) => setValue("gender", value as Gender)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={locale === "ar" ? "اختر الجنس" : "Select gender"} />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {locale === "ar" ? option.labelAr : option.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "معلومات الاتصال" : "Contact Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">
                {locale === "ar" ? "البريد الإلكتروني" : "Email"}
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
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
              <Label htmlFor="address.street">
                {locale === "ar" ? "الشارع" : "Street"}
              </Label>
              <Input
                id="address.street"
                {...register("address.street")}
                placeholder="123 Main St"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address.city">
                {locale === "ar" ? "المدينة" : "City"}
              </Label>
              <Input
                id="address.city"
                {...register("address.city")}
                placeholder="Riyadh"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="address.state">
                {locale === "ar" ? "المنطقة" : "State/Region"}
              </Label>
              <Input
                id="address.state"
                {...register("address.state")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address.postalCode">
                {locale === "ar" ? "الرمز البريدي" : "Postal Code"}
              </Label>
              <Input
                id="address.postalCode"
                {...register("address.postalCode")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address.country">
                {locale === "ar" ? "البلد" : "Country"}
              </Label>
              <Input
                id="address.country"
                {...register("address.country")}
                placeholder="Saudi Arabia"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "تفاصيل التوظيف" : "Employment Details"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hireDate">
                {locale === "ar" ? "تاريخ التعيين" : "Hire Date"} *
              </Label>
              <Input
                id="hireDate"
                type="date"
                {...register("hireDate")}
              />
              {errors.hireDate && (
                <p className="text-sm text-destructive">{errors.hireDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentType">
                {locale === "ar" ? "نوع التوظيف" : "Employment Type"} *
              </Label>
              <Select
                value={selectedEmploymentType}
                onValueChange={(value) => setValue("employmentType", value as EmploymentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {locale === "ar" ? type.labelAr : type.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="departmentId">
                {locale === "ar" ? "القسم" : "Department"}
              </Label>
              {deptsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedDeptId || ""}
                  onValueChange={(value) => setValue("departmentId", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={locale === "ar" ? "اختر القسم" : "Select department"} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {getLocalizedText(dept.name, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitleId">
                {locale === "ar" ? "المسمى الوظيفي" : "Job Title"}
              </Label>
              {jobTitlesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedJobTitleId || ""}
                  onValueChange={(value) => setValue("jobTitleId", value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={locale === "ar" ? "اختر المسمى الوظيفي" : "Select job title"} />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTitles?.map((jt) => (
                      <SelectItem key={jt.id} value={jt.id}>
                        {getLocalizedText(jt.name, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "جهة اتصال الطوارئ" : "Emergency Contact"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">
                {locale === "ar" ? "الاسم" : "Name"}
              </Label>
              <Input
                id="emergencyContactName"
                {...register("emergencyContactName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">
                {locale === "ar" ? "الهاتف" : "Phone"}
              </Label>
              <Input
                id="emergencyContactPhone"
                {...register("emergencyContactPhone")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactRelationship">
                {locale === "ar" ? "صلة القرابة" : "Relationship"}
              </Label>
              <Input
                id="emergencyContactRelationship"
                {...register("emergencyContactRelationship")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compensation (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "الراتب (اختياري)" : "Compensation (Optional)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="salaryAmount">
                {locale === "ar" ? "المبلغ" : "Amount"}
              </Label>
              <Input
                id="salaryAmount"
                type="number"
                step="0.01"
                {...register("salaryAmount", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryCurrency">
                {locale === "ar" ? "العملة" : "Currency"}
              </Label>
              <Input
                id="salaryCurrency"
                {...register("salaryCurrency")}
                placeholder="SAR"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryFrequency">
                {locale === "ar" ? "التكرار" : "Frequency"}
              </Label>
              <Select
                value={selectedSalaryFrequency || ""}
                onValueChange={(value) => setValue("salaryFrequency", value as SalaryFrequency)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={locale === "ar" ? "اختر التكرار" : "Select frequency"} />
                </SelectTrigger>
                <SelectContent>
                  {salaryFrequencies.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {locale === "ar" ? freq.labelAr : freq.labelEn}
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
          <CardTitle>
            {locale === "ar" ? "ملاحظات" : "Notes"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="notes.en">
                {locale === "ar" ? "ملاحظات (إنجليزي)" : "Notes (English)"}
              </Label>
              <Textarea
                id="notes.en"
                {...register("notes.en")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes.ar">
                {locale === "ar" ? "ملاحظات (عربي)" : "Notes (Arabic)"}
              </Label>
              <Textarea
                id="notes.ar"
                {...register("notes.ar")}
                rows={3}
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
            : employee
              ? locale === "ar"
                ? "حفظ التغييرات"
                : "Save Changes"
              : locale === "ar"
                ? "إنشاء الموظف"
                : "Create Employee"}
        </Button>
      </div>
    </form>
  );
}
