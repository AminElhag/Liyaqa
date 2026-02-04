"use client";

import { useLocale } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { EmployeeForm, type EmployeeFormData } from "@/components/forms/employee-form";
import { useEmployee, useUpdateEmployee } from "@liyaqa/shared/queries/use-employees";
import { useToast } from "@liyaqa/shared/hooks/use-toast";

export default function EditEmployeePage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const { data: employee, isLoading, error } = useEmployee(id);
  const updateEmployee = useUpdateEmployee();

  const handleSubmit = async (data: EmployeeFormData) => {
    try {
      // Only include notes if it has content (backend requires non-blank en if provided)
      const notesEn = data.notes?.en?.trim();
      const notesAr = data.notes?.ar?.trim();
      const hasNotes = notesEn || notesAr;

      await updateEmployee.mutateAsync({
        id,
        data: {
          firstName: { en: data.firstName.en, ar: data.firstName.ar || undefined },
          lastName: { en: data.lastName.en, ar: data.lastName.ar || undefined },
          dateOfBirth: data.dateOfBirth || undefined,
          gender: data.gender || undefined,
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address ? {
            street: data.address.street || undefined,
            city: data.address.city || undefined,
            state: data.address.state || undefined,
            postalCode: data.address.postalCode || undefined,
            country: data.address.country || undefined,
          } : undefined,
          departmentId: data.departmentId || undefined,
          jobTitleId: data.jobTitleId || undefined,
          employmentType: data.employmentType || undefined,
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
        },
      });

      toast({
        title: locale === "ar" ? "تم الحفظ" : "Saved",
        description: locale === "ar" ? "تم تحديث بيانات الموظف بنجاح" : "Employee updated successfully",
      });

      router.push(`/${locale}/employees/${id}`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في تحديث الموظف" : "Failed to update employee",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/employees`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {locale === "ar" ? "خطأ" : "Error"}
            </h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-neutral-500">
            {locale === "ar" ? "فشل في تحميل بيانات الموظف" : "Failed to load employee data"}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/employees/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {locale === "ar" ? "تعديل الموظف" : "Edit Employee"}
          </h1>
          <p className="text-neutral-500">
            {locale === "ar" ? "تحديث بيانات الموظف" : "Update employee information"}
          </p>
        </div>
      </div>

      {/* Form */}
      <EmployeeForm
        employee={employee}
        onSubmit={handleSubmit}
        isPending={updateEmployee.isPending}
        isEditMode={true}
      />
    </div>
  );
}
