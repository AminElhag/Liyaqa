"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployeeForm, type EmployeeFormData } from "@/components/forms/employee-form";
import { useCreateEmployee } from "@/queries/use-employees";
import { useCreateUser } from "@/queries/use-users";
import { useToast } from "@/hooks/use-toast";
import { useTenantStore } from "@/stores/tenant-store";
import type { UserRole } from "@/types/auth";

export default function NewEmployeePage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const { organizationId } = useTenantStore();
  const createUser = useCreateUser();
  const createEmployee = useCreateEmployee();

  const handleSubmit = async (data: EmployeeFormData) => {
    try {
      // Only include notes if it has content (backend requires non-blank en if provided)
      const notesEn = data.notes?.en?.trim();
      const notesAr = data.notes?.ar?.trim();
      const hasNotes = notesEn || notesAr;

      let userId = data.userId;

      // Step 1: Create user if needed
      if (data.createNewUser) {
        const newUser = await createUser.mutateAsync({
          email: data.newUserEmail!,
          password: data.newUserPassword!,
          displayNameEn: data.newUserDisplayNameEn!,
          displayNameAr: data.newUserDisplayNameAr || undefined,
          role: data.newUserRole as UserRole,
        });
        userId = newUser.id;
      }

      // Step 2: Create employee with userId
      await createEmployee.mutateAsync({
        userId: userId!,
        organizationId: data.organizationId || organizationId || "",
        firstName: { en: data.firstName.en, ar: data.firstName.ar || undefined },
        lastName: { en: data.lastName.en, ar: data.lastName.ar || undefined },
        hireDate: data.hireDate,
        employmentType: data.employmentType,
        email: data.email || undefined,
        phone: data.phone || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender || undefined,
        address: data.address ? {
          street: data.address.street || undefined,
          city: data.address.city || undefined,
          state: data.address.state || undefined,
          postalCode: data.address.postalCode || undefined,
          country: data.address.country || undefined,
        } : undefined,
        departmentId: data.departmentId || undefined,
        jobTitleId: data.jobTitleId || undefined,
        emergencyContactName: data.emergencyContactName || undefined,
        emergencyContactPhone: data.emergencyContactPhone || undefined,
        emergencyContactRelationship: data.emergencyContactRelationship || undefined,
        salaryAmount: data.salaryAmount || undefined,
        salaryCurrency: data.salaryCurrency || undefined,
        salaryFrequency: data.salaryFrequency || undefined,
        profileImageUrl: data.profileImageUrl || undefined,
        notes: hasNotes ? {
          en: notesEn || notesAr || "", // Use en if available, else ar as fallback
          ar: notesAr || undefined,
        } : undefined,
      });

      toast({
        title: locale === "ar" ? "تم الإنشاء" : "Created",
        description: locale === "ar" ? "تم إنشاء الموظف بنجاح" : "Employee created successfully",
      });

      router.push(`/${locale}/employees`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في إنشاء الموظف" : "Failed to create employee",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/employees`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {locale === "ar" ? "إضافة موظف جديد" : "Add New Employee"}
          </h1>
          <p className="text-neutral-500">
            {locale === "ar" ? "إنشاء ملف موظف جديد" : "Create a new employee profile"}
          </p>
        </div>
      </div>

      {/* Form */}
      <EmployeeForm
        defaultOrganizationId={organizationId || ""}
        onSubmit={handleSubmit}
        isPending={createUser.isPending || createEmployee.isPending}
      />
    </div>
  );
}
