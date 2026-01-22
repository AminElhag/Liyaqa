"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserForm, type UserFormData } from "@/components/forms/user-form";
import { useCreateUser } from "@/queries/use-users";
import { useToast } from "@/hooks/use-toast";

export default function NewUserPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const createUser = useCreateUser();

  const handleSubmit = async (data: UserFormData) => {
    if (!data.password) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "كلمة المرور مطلوبة" : "Password is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createUser.mutateAsync({
        email: data.email,
        password: data.password,
        displayNameEn: data.displayName.en,
        displayNameAr: data.displayName.ar || undefined,
        role: data.role,
      });
      toast({
        title: locale === "ar" ? "تم الإنشاء" : "Created",
        description:
          locale === "ar"
            ? "تم إنشاء المستخدم بنجاح"
            : "User created successfully",
      });
      router.push(`/${locale}/users/${result.id}`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل في إنشاء المستخدم" : "Failed to create user",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/users`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمستخدمين" : "Back to users"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">
          {locale === "ar" ? "إضافة مستخدم جديد" : "Add New User"}
        </h1>
        <p className="text-neutral-500">
          {locale === "ar"
            ? "أدخل معلومات المستخدم الجديد"
            : "Enter the new user details"}
        </p>
      </div>

      <UserForm
        onSubmit={handleSubmit}
        isPending={createUser.isPending}
      />
    </div>
  );
}
