"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  AlertCircle,
  Loader2,
  Check,
  Pencil,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { useMyProfile, useUpdateMyProfile } from "@liyaqa/shared/queries/use-member-portal";
import { toast } from "sonner";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const t = useTranslations("member.profile");
  const locale = useLocale();
  const [isEditing, setIsEditing] = React.useState(false);

  const { data: profile, isLoading } = useMyProfile();
  const updateProfileMutation = useUpdateMyProfile({
    onSuccess: () => {
      toast.success(
        locale === "ar" ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully"
      );
      setIsEditing(false);
    },
    onError: () => {
      toast.error(
        locale === "ar" ? "فشل في تحديث الملف الشخصي" : "Failed to update profile"
      );
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      dateOfBirth: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
    },
  });

  // Reset form when profile data loads or changes
  React.useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth || "",
        emergencyContactName: profile.emergencyContactName || "",
        emergencyContactPhone: profile.emergencyContactPhone || "",
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    if (profile) {
      reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth || "",
        emergencyContactName: profile.emergencyContactName || "",
        emergencyContactPhone: profile.emergencyContactPhone || "",
      });
    }
    setIsEditing(false);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      ACTIVE: { variant: "default", label: locale === "ar" ? "نشط" : "Active" },
      SUSPENDED: { variant: "destructive", label: locale === "ar" ? "موقوف" : "Suspended" },
      FROZEN: { variant: "secondary", label: locale === "ar" ? "مجمد" : "Frozen" },
      CANCELLED: { variant: "destructive", label: locale === "ar" ? "ملغي" : "Cancelled" },
      PENDING: { variant: "secondary", label: locale === "ar" ? "قيد الانتظار" : "Pending" },
    };
    const { variant, label } = statusMap[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {profile?.fullName || t("title")}
              </h1>
              {profile?.status && getStatusBadge(profile.status)}
            </div>
            <p className="text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
        {!isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 me-2" />
            {t("editProfile")}
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Basic Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {t("contactInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  {locale === "ar" ? "الاسم الأول" : "First Name"}
                </Label>
                {isEditing ? (
                  <>
                    <Input id="firstName" {...register("firstName")} />
                    {errors.firstName && (
                      <p className="text-sm text-danger">{errors.firstName.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-foreground">{profile?.firstName || "-"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {locale === "ar" ? "اسم العائلة" : "Last Name"}
                </Label>
                {isEditing ? (
                  <>
                    <Input id="lastName" {...register("lastName")} />
                    {errors.lastName && (
                      <p className="text-sm text-danger">{errors.lastName.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-foreground">{profile?.lastName || "-"}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {locale === "ar" ? "البريد الإلكتروني" : "Email"}
              </Label>
              <p className="text-foreground">{profile?.email || "-"}</p>
              <p className="text-xs text-muted-foreground">
                {locale === "ar"
                  ? "لا يمكن تغيير البريد الإلكتروني"
                  : "Email cannot be changed"}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {locale === "ar" ? "رقم الهاتف" : "Phone Number"}
                </Label>
                {isEditing ? (
                  <Input id="phone" {...register("phone")} />
                ) : (
                  <p className="text-foreground">{profile?.phone || "-"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {locale === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
                </Label>
                {isEditing ? (
                  <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                ) : (
                  <p className="text-foreground">
                    {profile?.dateOfBirth
                      ? new Date(profile.dateOfBirth).toLocaleDateString(
                          locale === "ar" ? "ar-SA" : "en-US"
                        )
                      : "-"}
                  </p>
                )}
              </div>
            </div>

            {profile?.address && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {locale === "ar" ? "العنوان" : "Address"}
                </Label>
                <p className="text-foreground">
                  {[
                    profile.address.street,
                    profile.address.city,
                    profile.address.state,
                    profile.address.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              {t("emergencyContact")}
            </CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "معلومات جهة الاتصال في حالات الطوارئ"
                : "Emergency contact information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">
                  {locale === "ar" ? "اسم جهة الاتصال" : "Contact Name"}
                </Label>
                {isEditing ? (
                  <Input
                    id="emergencyContactName"
                    {...register("emergencyContactName")}
                  />
                ) : (
                  <p className="text-foreground">
                    {profile?.emergencyContactName || "-"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">
                  {locale === "ar" ? "رقم الهاتف" : "Phone Number"}
                </Label>
                {isEditing ? (
                  <Input
                    id="emergencyContactPhone"
                    {...register("emergencyContactPhone")}
                  />
                ) : (
                  <p className="text-foreground">
                    {profile?.emergencyContactPhone || "-"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateProfileMutation.isPending}
            >
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {locale === "ar" ? "جاري الحفظ..." : "Saving..."}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 me-2" />
                  {locale === "ar" ? "حفظ التغييرات" : "Save Changes"}
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
