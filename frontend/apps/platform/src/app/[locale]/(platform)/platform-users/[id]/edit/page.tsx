"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import {
  PlatformUserForm,
  type PlatformUserFormValues,
} from "@liyaqa/shared/components/platform/platform-user-form";
import {
  usePlatformUser,
  useUpdatePlatformUser,
} from "@liyaqa/shared/queries/platform/use-platform-users";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import type { UpdatePlatformUserRequest } from "@liyaqa/shared/types/platform/platform-user";

export default function EditPlatformUserPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const userId = params.id as string;

  // Data fetching
  const { data: user, isLoading, error } = usePlatformUser(userId);
  const updateUser = useUpdatePlatformUser();

  const texts = {
    title: locale === "ar" ? "تعديل مستخدم المنصة" : "Edit Platform User",
    description:
      locale === "ar"
        ? "تحديث معلومات المستخدم"
        : "Update user information",
    successTitle: locale === "ar" ? "تم التحديث" : "Updated",
    successDesc:
      locale === "ar"
        ? "تم تحديث المستخدم بنجاح"
        : "Platform user updated successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    loadingError:
      locale === "ar" ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    notFound: locale === "ar" ? "المستخدم غير موجود" : "User not found",
  };

  const handleSubmit = (data: PlatformUserFormValues) => {
    // Convert form values to API request (email is not updated in edit mode)
    const request: UpdatePlatformUserRequest = {
      displayNameEn: data.displayNameEn,
      displayNameAr: data.displayNameAr || undefined,
      role: data.role,
      phoneNumber: data.phoneNumber || undefined,
    };

    updateUser.mutate(
      { id: userId, data: request },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.successDesc,
          });
          router.push(`/${locale}/platform-users/${userId}`);
        },
        onError: (error) => {
          toast({
            title: texts.errorTitle,
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  // Error or not found
  if (error || !user) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.loadingError : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/platform-users/${userId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {texts.title} - {locale === "ar" ? user.displayNameAr || user.displayNameEn : user.displayNameEn}
          </h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
      </div>

      {/* Form */}
      <PlatformUserForm
        user={user}
        onSubmit={handleSubmit}
        isLoading={updateUser.isPending}
        mode="edit"
      />
    </div>
  );
}
