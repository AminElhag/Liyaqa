"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  PlatformUserForm,
  type PlatformUserFormValues,
} from "@/components/platform/platform-user-form";
import { useCreatePlatformUser } from "@liyaqa/shared/queries/platform/use-platform-users";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import type { CreatePlatformUserRequest } from "@liyaqa/shared/types/platform/platform-user";

export default function NewPlatformUserPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const createUser = useCreatePlatformUser();

  const texts = {
    title: locale === "ar" ? "إنشاء مستخدم منصة" : "Create Platform User",
    description:
      locale === "ar"
        ? "إضافة مستخدم جديد لفريق المنصة"
        : "Add a new user to the platform team",
    successTitle: locale === "ar" ? "تم الإنشاء" : "Created",
    successDesc:
      locale === "ar"
        ? "تم إنشاء المستخدم بنجاح"
        : "Platform user created successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    passwordRequired:
      locale === "ar" ? "كلمة المرور مطلوبة" : "Password is required",
    passwordMismatch:
      locale === "ar"
        ? "كلمتا المرور غير متطابقتين"
        : "Passwords do not match",
  };

  const handleSubmit = (data: PlatformUserFormValues) => {
    // Validate password for create mode
    if (!data.password) {
      toast({
        title: texts.errorTitle,
        description: texts.passwordRequired,
        variant: "destructive",
      });
      return;
    }

    if (data.password !== data.confirmPassword) {
      toast({
        title: texts.errorTitle,
        description: texts.passwordMismatch,
        variant: "destructive",
      });
      return;
    }

    // Convert form values to API request
    const request: CreatePlatformUserRequest = {
      email: data.email,
      password: data.password,
      displayNameEn: data.displayNameEn,
      displayNameAr: data.displayNameAr || undefined,
      role: data.role,
      phoneNumber: data.phoneNumber || undefined,
    };

    createUser.mutate(request, {
      onSuccess: (result) => {
        toast({
          title: texts.successTitle,
          description: texts.successDesc,
        });
        router.push(`/${locale}/platform-users/${result.id}`);
      },
      onError: (error) => {
        toast({
          title: texts.errorTitle,
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/platform-users`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
      </div>

      {/* Form */}
      <PlatformUserForm
        onSubmit={handleSubmit}
        isLoading={createUser.isPending}
        mode="create"
      />
    </div>
  );
}
