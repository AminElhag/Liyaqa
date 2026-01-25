"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Edit,
  UserCheck,
  UserX,
  KeyRound,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loading } from "@/components/ui/spinner";
import { PlatformUserStatusBadge } from "@/components/platform/platform-user-status-badge";
import { PlatformUserRoleBadge } from "@/components/platform/platform-user-role-badge";
import { ResetPasswordDialog } from "@/components/platform/reset-password-dialog";
import { useAuthStore } from "@/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import {
  usePlatformUser,
  usePlatformUserActivities,
  useChangePlatformUserStatus,
  useResetPlatformUserPassword,
} from "@/queries/platform/use-platform-users";

/**
 * Format date for display.
 */
function formatDate(dateString: string, locale: string): string {
  return new Date(dateString).toLocaleString(
    locale === "ar" ? "ar-SA" : "en-SA",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

/**
 * Format relative time for display.
 */
function formatRelativeTime(
  dateString: string | undefined,
  locale: string
): string {
  if (!dateString) {
    return locale === "ar" ? "لم يسجل الدخول" : "Never logged in";
  }

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return locale === "ar" ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
  }
  if (diffHours > 0) {
    return locale === "ar" ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
  }
  if (diffMinutes > 0) {
    return locale === "ar" ? `منذ ${diffMinutes} دقيقة` : `${diffMinutes}m ago`;
  }
  return locale === "ar" ? "الآن" : "Just now";
}

export default function PlatformUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();

  const userId = params.id as string;

  // Permissions
  const canEdit = currentUser?.role === "PLATFORM_ADMIN";

  // Dialog state
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);

  // Data fetching
  const { data: user, isLoading, error } = usePlatformUser(userId);
  const { data: activitiesData, isLoading: activitiesLoading } =
    usePlatformUserActivities(userId, { size: 5 });
  const changeStatus = useChangePlatformUserStatus();
  const resetPassword = useResetPlatformUserPassword();

  const activities = activitiesData?.content || [];

  // Bilingual texts
  const texts = {
    back: locale === "ar" ? "العودة" : "Back",
    edit: locale === "ar" ? "تعديل" : "Edit",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    suspend: locale === "ar" ? "إيقاف" : "Suspend",
    resetPassword: locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password",
    userDetails: locale === "ar" ? "تفاصيل المستخدم" : "User Details",
    userDetailsDesc:
      locale === "ar" ? "معلومات الحساب الأساسية" : "Basic account information",
    contactInfo: locale === "ar" ? "معلومات الاتصال" : "Contact Information",
    contactInfoDesc:
      locale === "ar" ? "البريد الإلكتروني والهاتف" : "Email and phone",
    roleAndAccess: locale === "ar" ? "الدور والوصول" : "Role & Access",
    roleAndAccessDesc:
      locale === "ar" ? "مستوى الصلاحيات" : "Permission level",
    recentActivity: locale === "ar" ? "النشاط الأخير" : "Recent Activity",
    recentActivityDesc:
      locale === "ar" ? "آخر الإجراءات" : "Latest actions",
    timestamps: locale === "ar" ? "التواريخ" : "Timestamps",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    notProvided: locale === "ar" ? "غير متوفر" : "Not provided",
    displayNameEn: locale === "ar" ? "الاسم (إنجليزي)" : "Display Name (EN)",
    displayNameAr: locale === "ar" ? "الاسم (عربي)" : "Display Name (AR)",
    role: locale === "ar" ? "الدور" : "Role",
    status: locale === "ar" ? "الحالة" : "Status",
    lastLogin: locale === "ar" ? "آخر تسجيل دخول" : "Last Login",
    createdAt: locale === "ar" ? "تاريخ الإنشاء" : "Created At",
    updatedAt: locale === "ar" ? "آخر تحديث" : "Last Updated",
    createdBy: locale === "ar" ? "أنشئ بواسطة" : "Created By",
    noActivity: locale === "ar" ? "لا يوجد نشاط" : "No activity yet",
    loadingError:
      locale === "ar" ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    notFound: locale === "ar" ? "المستخدم غير موجود" : "User not found",
    successTitle: locale === "ar" ? "تم" : "Success",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    activatedSuccess:
      locale === "ar" ? "تم تفعيل المستخدم" : "User activated successfully",
    suspendedSuccess:
      locale === "ar" ? "تم إيقاف المستخدم" : "User suspended successfully",
    resetPasswordSuccess:
      locale === "ar"
        ? "تم إعادة تعيين كلمة المرور بنجاح"
        : "Password reset successfully",
  };

  // Handlers
  const handleActivate = () => {
    changeStatus.mutate(
      { id: userId, data: { status: "ACTIVE" } },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.activatedSuccess,
          });
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

  const handleSuspend = () => {
    changeStatus.mutate(
      { id: userId, data: { status: "SUSPENDED" } },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.suspendedSuccess,
          });
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

  const handleResetPassword = () => {
    setResetPasswordDialogOpen(true);
  };

  const handleResetPasswordSubmit = async (newPassword: string) => {
    return new Promise<void>((resolve, reject) => {
      resetPassword.mutate(
        { id: userId, data: { newPassword } },
        {
          onSuccess: () => {
            toast({
              title: texts.successTitle,
              description: texts.resetPasswordSuccess,
            });
            setResetPasswordDialogOpen(false);
            resolve();
          },
          onError: (error) => {
            toast({
              title: texts.errorTitle,
              description: error.message,
              variant: "destructive",
            });
            reject(error);
          },
        }
      );
    });
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

  const canActivate = user.status !== "ACTIVE";
  const canSuspend = user.status === "ACTIVE";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/platform-users`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {locale === "ar"
                    ? user.displayNameAr || user.displayNameEn
                    : user.displayNameEn}
                </h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              <PlatformUserStatusBadge status={user.status} />
              <PlatformUserRoleBadge role={user.role} showIcon />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/platform-users/${userId}/edit`)}
            >
              <Edit className="me-2 h-4 w-4" />
              {texts.edit}
            </Button>
            {canActivate && (
              <Button variant="outline" onClick={handleActivate}>
                <UserCheck className="me-2 h-4 w-4 text-green-600" />
                {texts.activate}
              </Button>
            )}
            {canSuspend && (
              <Button variant="outline" onClick={handleSuspend}>
                <UserX className="me-2 h-4 w-4 text-red-600" />
                {texts.suspend}
              </Button>
            )}
            <Button variant="outline" onClick={handleResetPassword}>
              <KeyRound className="me-2 h-4 w-4 text-amber-600" />
              {texts.resetPassword}
            </Button>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>{texts.userDetails}</CardTitle>
            </div>
            <CardDescription>{texts.userDetailsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{texts.displayNameEn}</p>
                <p className="font-medium">{user.displayNameEn}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{texts.displayNameAr}</p>
                <p className="font-medium" dir="rtl">
                  {user.displayNameAr || texts.notProvided}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{texts.status}</p>
                <PlatformUserStatusBadge status={user.status} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{texts.lastLogin}</p>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">
                    {formatRelativeTime(user.lastLoginAt, locale)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>{texts.contactInfo}</CardTitle>
            </div>
            <CardDescription>{texts.contactInfoDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{texts.email}</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.phone}</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className={user.phoneNumber ? "font-medium" : "text-muted-foreground italic"}>
                  {user.phoneNumber || texts.notProvided}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>{texts.roleAndAccess}</CardTitle>
            </div>
            <CardDescription>{texts.roleAndAccessDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{texts.role}</p>
              <PlatformUserRoleBadge role={user.role} showIcon />
            </div>
            {user.createdByName && (
              <div>
                <p className="text-sm text-muted-foreground">{texts.createdBy}</p>
                <p className="font-medium">{user.createdByName}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timestamps Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>{texts.timestamps}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{texts.createdAt}</p>
              <p className="font-medium">{formatDate(user.createdAt, locale)}</p>
            </div>
            {user.updatedAt && (
              <div>
                <p className="text-sm text-muted-foreground">{texts.updatedAt}</p>
                <p className="font-medium">{formatDate(user.updatedAt, locale)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle>{texts.recentActivity}</CardTitle>
            </div>
            <CardDescription>{texts.recentActivityDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loading />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                {texts.noActivity}
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(activity.createdAt, locale)}
                        {activity.ipAddress && ` • ${activity.ipAddress}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {user && (
        <ResetPasswordDialog
          open={resetPasswordDialogOpen}
          onOpenChange={setResetPasswordDialogOpen}
          userEmail={user.email}
          userName={locale === "ar" ? user.displayNameAr || user.displayNameEn : user.displayNameEn}
          locale={locale}
          onSubmit={handleResetPasswordSubmit}
          isLoading={resetPassword.isPending}
        />
      )}
    </div>
  );
}
