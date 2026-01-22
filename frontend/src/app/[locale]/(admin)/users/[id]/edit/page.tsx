"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserForm, type UserFormData } from "@/components/forms/user-form";
import { useUser, useUpdateUser } from "@/queries/use-users";
import { useToast } from "@/hooks/use-toast";
import { getLocalizedText } from "@/lib/utils";

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const { data: user, isLoading, error } = useUser(id);
  const updateUser = useUpdateUser();

  const handleSubmit = async (data: UserFormData) => {
    try {
      await updateUser.mutateAsync({
        id,
        data: {
          displayNameEn: data.displayName.en,
          displayNameAr: data.displayName.ar || undefined,
          role: data.role,
        },
      });
      toast({
        title: locale === "ar" ? "تم الحفظ" : "Saved",
        description:
          locale === "ar"
            ? "تم حفظ التغييرات بنجاح"
            : "Changes saved successfully",
      });
      router.push(`/${locale}/users/${id}`);
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar" ? "فشل في حفظ التغييرات" : "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/users`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمستخدمين" : "Back to users"}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>
              {locale === "ar"
                ? "لم يتم العثور على المستخدم"
                : "User not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/users/${id}`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للمستخدم" : "Back to user"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">
          {locale === "ar" ? "تعديل المستخدم" : "Edit User"}
        </h1>
        <p className="text-neutral-500">
          {getLocalizedText(user.displayName, locale)}
        </p>
      </div>

      <UserForm
        user={user}
        onSubmit={handleSubmit}
        isPending={updateUser.isPending}
      />
    </div>
  );
}
