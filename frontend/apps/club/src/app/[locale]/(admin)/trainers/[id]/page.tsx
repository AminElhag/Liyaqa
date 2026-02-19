"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Edit,
  CheckCircle,
  Power,
  Briefcase,
  Mail,
  Phone,
  Award,
  Clock,
  DollarSign,
  Star,
  MapPin,
  Users,
  Calendar,
  Home,
  Car,
  AlertCircle,
  KeyRound,
  Send,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { LoadingButton } from "@liyaqa/shared/components/ui/loading-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@liyaqa/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@liyaqa/shared/components/ui/avatar";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@liyaqa/shared/components/ui/tabs";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { TrainerStatusBadge } from "@/components/admin/trainer-status-badge";
import { TrainerTypeBadge } from "@/components/admin/trainer-type-badge";
import {
  useTrainer,
  useActivateTrainer,
  useDeactivateTrainer,
  useSetTrainerOnLeave,
  useResetTrainerPassword,
  useSendTrainerResetEmail,
} from "@liyaqa/shared/queries/use-trainers";
import { useTrainerAvailabilitySlots } from "@liyaqa/shared/queries/use-trainer-availability";
import { useTrainerPTSessions } from "@liyaqa/shared/queries/use-pt-sessions";
import { getLocalizedText, formatDate } from "@liyaqa/shared/utils";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api/client";
import type { UUID } from "@liyaqa/shared/types/api";
import type { DayOfWeek } from "@liyaqa/shared/types/scheduling";

const DAYS_OF_WEEK: { dayOfWeek: DayOfWeek; en: string; ar: string }[] = [
  { dayOfWeek: "MONDAY", en: "Monday", ar: "الاثنين" },
  { dayOfWeek: "TUESDAY", en: "Tuesday", ar: "الثلاثاء" },
  { dayOfWeek: "WEDNESDAY", en: "Wednesday", ar: "الأربعاء" },
  { dayOfWeek: "THURSDAY", en: "Thursday", ar: "الخميس" },
  { dayOfWeek: "FRIDAY", en: "Friday", ar: "الجمعة" },
  { dayOfWeek: "SATURDAY", en: "Saturday", ar: "السبت" },
  { dayOfWeek: "SUNDAY", en: "Sunday", ar: "الأحد" },
];

export default function TrainerDetailPage() {
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as UUID;
  const isRTL = locale === "ar";

  const [activeTab, setActiveTab] = useState("profile");
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [sendResetEmailOpen, setSendResetEmailOpen] = useState(false);

  const { data: trainer, isLoading, error } = useTrainer(id);
  const { data: availabilitySlots, isLoading: isLoadingAvailability } = useTrainerAvailabilitySlots(id);
  const { data: ptSessions, isLoading: isLoadingSessions } = useTrainerPTSessions(id, { size: 20 });
  const activateTrainer = useActivateTrainer();
  const deactivateTrainer = useDeactivateTrainer();
  const setOnLeave = useSetTrainerOnLeave();
  const resetPassword = useResetTrainerPassword();
  const sendResetEmail = useSendTrainerResetEmail();

  const resetPwSchema = z.object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  }).refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match", path: ["confirmPassword"],
  });

  const resetPwForm = useForm<{ newPassword: string; confirmPassword: string }>({
    resolver: zodResolver(resetPwSchema),
  });

  const texts = {
    back: locale === "ar" ? "العودة إلى المدربين" : "Back to Trainers",
    edit: locale === "ar" ? "تعديل" : "Edit",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    deactivate: locale === "ar" ? "إلغاء التفعيل" : "Deactivate",
    setOnLeave: locale === "ar" ? "إجازة" : "Set On Leave",
    manageAvailability: locale === "ar" ? "إدارة الجدول" : "Manage Availability",
    error: locale === "ar" ? "حدث خطأ أثناء تحميل المدرب" : "Error loading trainer",
    notFound: locale === "ar" ? "المدرب غير موجود" : "Trainer not found",

    // Tabs
    profile: locale === "ar" ? "الملف الشخصي" : "Profile",
    availability: locale === "ar" ? "الجدول" : "Availability",
    sessions: locale === "ar" ? "الجلسات" : "Sessions",
    clients: locale === "ar" ? "العملاء" : "Clients",

    // Profile section
    profileInfo: locale === "ar" ? "معلومات الملف الشخصي" : "Profile Information",
    contactInfo: locale === "ar" ? "معلومات الاتصال" : "Contact Information",
    qualifications: locale === "ar" ? "المؤهلات" : "Qualifications",
    skills: locale === "ar" ? "المهارات التدريبية" : "Training Skills",
    noSkills: locale === "ar" ? "لا توجد مهارات محددة" : "No skills assigned",
    compensation: locale === "ar" ? "التعويضات" : "Compensation",
    ptSettings: locale === "ar" ? "إعدادات التدريب الشخصي" : "Personal Training Settings",

    // Fields
    bio: locale === "ar" ? "السيرة الذاتية" : "Bio",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    experienceYears: locale === "ar" ? "سنوات الخبرة" : "Years of Experience",
    specializations: locale === "ar" ? "التخصصات" : "Specializations",
    certifications: locale === "ar" ? "الشهادات" : "Certifications",
    hourlyRate: locale === "ar" ? "السعر بالساعة" : "Hourly Rate",
    ptSessionRate: locale === "ar" ? "سعر جلسة PT" : "PT Session Rate",
    compensationModel: locale === "ar" ? "نموذج التعويض" : "Compensation Model",
    homeService: locale === "ar" ? "خدمة منزلية" : "Home Service",
    travelFee: locale === "ar" ? "رسوم التنقل" : "Travel Fee",
    travelRadius: locale === "ar" ? "نطاق التنقل" : "Travel Radius",
    maxClients: locale === "ar" ? "الحد الأقصى للعملاء" : "Max Clients",
    rating: locale === "ar" ? "التقييم" : "Rating",
    years: locale === "ar" ? "سنوات" : "years",
    km: locale === "ar" ? "كم" : "km",
    na: locale === "ar" ? "غير محدد" : "N/A",
    noCertifications: locale === "ar" ? "لا توجد شهادات" : "No certifications",
    noSpecializations: locale === "ar" ? "لا توجد تخصصات" : "No specializations",
    available: locale === "ar" ? "متاح" : "Available",
    notAvailable: locale === "ar" ? "غير متاح" : "Not Available",
    yes: locale === "ar" ? "نعم" : "Yes",
    no: locale === "ar" ? "لا" : "No",

    // Availability
    weeklySchedule: locale === "ar" ? "الجدول الأسبوعي" : "Weekly Schedule",
    noAvailabilitySet: locale === "ar" ? "لم يتم تعيين جدول" : "No availability set",
    noSlots: locale === "ar" ? "لا توجد فترات" : "No slots",

    // Sessions
    ptSessions: locale === "ar" ? "جلسات التدريب الشخصي" : "PT Sessions",
    noSessions: locale === "ar" ? "لا توجد جلسات" : "No sessions found",
    sessionDate: locale === "ar" ? "التاريخ" : "Date",
    sessionTime: locale === "ar" ? "الوقت" : "Time",
    sessionStatus: locale === "ar" ? "الحالة" : "Status",
    className: locale === "ar" ? "الفصل" : "Class",

    // Clients
    activeClients: locale === "ar" ? "العملاء النشطين" : "Active Clients",
    noClients: locale === "ar" ? "لا يوجد عملاء حاليا" : "No active clients",
    clientsComingSoon: locale === "ar" ? "قريبا - قائمة العملاء المرتبطين بالمدرب" : "Coming soon - list of clients assigned to this trainer",

    // Password reset
    resetPasswordTitle: locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password",
    setNewPassword: locale === "ar" ? "تعيين كلمة مرور جديدة" : "Set New Password",
    sendResetEmail: locale === "ar" ? "إرسال بريد إعادة التعيين" : "Send Reset Email",
    newPassword: locale === "ar" ? "كلمة المرور الجديدة" : "New Password",
    confirmNewPassword: locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password",
    setNewPasswordDesc: locale === "ar" ? "تعيين كلمة مرور جديدة لهذا المدرب" : "Set a new password for this trainer",
    sendResetEmailDesc: locale === "ar"
      ? "سيتم إرسال رابط إعادة تعيين كلمة المرور إلى بريد المدرب"
      : "A password reset link will be sent to the trainer's email",
    sendResetEmailConfirm: locale === "ar" ? "إرسال" : "Send",
    passwordResetSuccess: locale === "ar" ? "تم إعادة تعيين كلمة المرور بنجاح" : "Password reset successfully",
    resetEmailSent: locale === "ar" ? "تم إرسال بريد إعادة التعيين" : "Reset email sent successfully",
    noUserAccount: locale === "ar" ? "لا يوجد حساب مستخدم مرتبط" : "No linked user account",

    // Toast
    activatedSuccess: locale === "ar" ? "تم تفعيل المدرب بنجاح" : "Trainer activated successfully",
    deactivatedSuccess: locale === "ar" ? "تم إلغاء تفعيل المدرب بنجاح" : "Trainer deactivated successfully",
    onLeaveSuccess: locale === "ar" ? "تم وضع المدرب في إجازة بنجاح" : "Trainer set on leave successfully",
    actionError: locale === "ar" ? "حدث خطأ أثناء تنفيذ العملية" : "Error performing action",
    activating: locale === "ar" ? "جاري التفعيل..." : "Activating...",
    deactivating: locale === "ar" ? "جاري إلغاء التفعيل..." : "Deactivating...",
    settingOnLeave: locale === "ar" ? "جاري وضع الإجازة..." : "Setting on leave...",
  };

  const COMPENSATION_LABELS: Record<string, { en: string; ar: string }> = {
    HOURLY: { en: "Hourly", ar: "بالساعة" },
    PER_SESSION: { en: "Per Session", ar: "لكل جلسة" },
    REVENUE_SHARE: { en: "Revenue Share", ar: "حصة الإيرادات" },
    SALARY_PLUS_COMMISSION: { en: "Salary + Commission", ar: "راتب + عمولة" },
  };

  const SESSION_STATUS_LABELS: Record<string, { en: string; ar: string; color: string }> = {
    SCHEDULED: { en: "Scheduled", ar: "مجدولة", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    IN_PROGRESS: { en: "In Progress", ar: "قيد التنفيذ", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
    COMPLETED: { en: "Completed", ar: "مكتملة", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
    CANCELLED: { en: "Cancelled", ar: "ملغاة", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-destructive">{error ? texts.error : texts.notFound}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/trainers`}>{texts.back}</Link>
        </Button>
      </div>
    );
  }

  const name = getLocalizedText(trainer.displayName, locale) || texts.na;
  const initials = name.slice(0, 2).toUpperCase();
  const bio = getLocalizedText(trainer.bio, locale);
  const canActivate = trainer.status === "INACTIVE" || trainer.status === "ON_LEAVE";
  const canDeactivate = trainer.status === "ACTIVE";
  const canSetOnLeave = trainer.status === "ACTIVE";
  const isAnyActionPending = activateTrainer.isPending || deactivateTrainer.isPending || setOnLeave.isPending;

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const handleActivate = () => {
    activateTrainer.mutate(id, {
      onSuccess: () => toast({ title: texts.activatedSuccess }),
      onError: async (error) => {
        const apiError = await parseApiError(error);
        toast({ title: texts.actionError, description: getLocalizedErrorMessage(apiError, locale), variant: "destructive" });
      },
    });
  };

  const handleDeactivate = () => {
    deactivateTrainer.mutate(id, {
      onSuccess: () => toast({ title: texts.deactivatedSuccess }),
      onError: async (error) => {
        const apiError = await parseApiError(error);
        toast({ title: texts.actionError, description: getLocalizedErrorMessage(apiError, locale), variant: "destructive" });
      },
    });
  };

  const handleSetOnLeave = () => {
    setOnLeave.mutate(id, {
      onSuccess: () => toast({ title: texts.onLeaveSuccess }),
      onError: async (error) => {
        const apiError = await parseApiError(error);
        toast({ title: texts.actionError, description: getLocalizedErrorMessage(apiError, locale), variant: "destructive" });
      },
    });
  };

  const handleResetPassword = (data: { newPassword: string; confirmPassword: string }) => {
    resetPassword.mutate(
      { id, data: { newPassword: data.newPassword } },
      {
        onSuccess: () => {
          toast({ title: texts.passwordResetSuccess });
          setResetPasswordOpen(false);
          resetPwForm.reset();
        },
        onError: async (error) => {
          const apiError = await parseApiError(error);
          toast({ title: texts.actionError, description: getLocalizedErrorMessage(apiError, locale), variant: "destructive" });
        },
      }
    );
  };

  const handleSendResetEmail = () => {
    sendResetEmail.mutate(id, {
      onSuccess: () => {
        toast({ title: texts.resetEmailSent });
        setSendResetEmailOpen(false);
      },
      onError: async (error) => {
        const apiError = await parseApiError(error);
        toast({ title: texts.actionError, description: getLocalizedErrorMessage(apiError, locale), variant: "destructive" });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/trainers`}
            className="inline-flex items-center justify-center rounded-lg border bg-background p-2 hover:bg-muted transition-colors"
          >
            <BackArrow className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={trainer.profileImageUrl || undefined} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
                <TrainerStatusBadge status={trainer.status} />
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <TrainerTypeBadge type={trainer.trainerType} showIcon />
                {trainer.rating !== undefined && trainer.rating !== null && (
                  <Badge variant="outline" className="gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {trainer.rating.toFixed(1)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canActivate && (
            <LoadingButton
              variant="outline"
              size="sm"
              onClick={handleActivate}
              isLoading={activateTrainer.isPending}
              disabled={isAnyActionPending}
              loadingText={texts.activating}
            >
              <CheckCircle className="me-2 h-4 w-4" />
              {texts.activate}
            </LoadingButton>
          )}
          {canSetOnLeave && (
            <LoadingButton
              variant="outline"
              size="sm"
              onClick={handleSetOnLeave}
              isLoading={setOnLeave.isPending}
              disabled={isAnyActionPending}
              loadingText={texts.settingOnLeave}
            >
              <Briefcase className="me-2 h-4 w-4" />
              {texts.setOnLeave}
            </LoadingButton>
          )}
          {canDeactivate && (
            <LoadingButton
              variant="outline"
              size="sm"
              onClick={handleDeactivate}
              isLoading={deactivateTrainer.isPending}
              disabled={isAnyActionPending}
              loadingText={texts.deactivating}
            >
              <Power className="me-2 h-4 w-4" />
              {texts.deactivate}
            </LoadingButton>
          )}
          {trainer.userId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <KeyRound className="me-2 h-4 w-4" />
                  {texts.resetPasswordTitle}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setResetPasswordOpen(true)}>
                  <KeyRound className="me-2 h-4 w-4" />
                  {texts.setNewPassword}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSendResetEmailOpen(true)}>
                  <Send className="me-2 h-4 w-4" />
                  {texts.sendResetEmail}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button size="sm" asChild>
            <Link href={`/${locale}/trainers/${id}/edit`}>
              <Edit className="me-2 h-4 w-4" />
              {texts.edit}
            </Link>
          </Button>
        </div>
      </div>

      {/* Set New Password Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{texts.setNewPassword}</DialogTitle>
            <DialogDescription>{texts.setNewPasswordDesc}</DialogDescription>
          </DialogHeader>
          <form onSubmit={resetPwForm.handleSubmit(handleResetPassword)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{texts.newPassword}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  {...resetPwForm.register("newPassword")}
                />
                {resetPwForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">{resetPwForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPw">{texts.confirmNewPassword}</Label>
                <Input
                  id="confirmPw"
                  type="password"
                  autoComplete="new-password"
                  {...resetPwForm.register("confirmPassword")}
                />
                {resetPwForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{resetPwForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetPasswordOpen(false)}>
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={resetPassword.isPending}>
                {resetPassword.isPending
                  ? (locale === "ar" ? "جاري الحفظ..." : "Saving...")
                  : texts.setNewPassword}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Send Reset Email Dialog */}
      <Dialog open={sendResetEmailOpen} onOpenChange={setSendResetEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{texts.sendResetEmail}</DialogTitle>
            <DialogDescription>{texts.sendResetEmailDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendResetEmailOpen(false)}>
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleSendResetEmail} disabled={sendResetEmail.isPending}>
              {sendResetEmail.isPending
                ? (locale === "ar" ? "جاري الإرسال..." : "Sending...")
                : texts.sendResetEmailConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="profile">{texts.profile}</TabsTrigger>
          <TabsTrigger value="availability">{texts.availability}</TabsTrigger>
          <TabsTrigger value="sessions">{texts.sessions}</TabsTrigger>
          <TabsTrigger value="clients">{texts.clients}</TabsTrigger>
        </TabsList>

        {/* ==================== PROFILE TAB ==================== */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{texts.profileInfo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bio && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{texts.bio}</p>
                    <p className="mt-1 text-sm">{bio}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{texts.experienceYears}:</span>
                  <span className="text-sm">
                    {trainer.experienceYears
                      ? `${trainer.experienceYears} ${texts.years}`
                      : texts.na}
                  </span>
                </div>
                {trainer.rating !== undefined && trainer.rating !== null && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-muted-foreground">{texts.rating}:</span>
                    <span className="text-sm">{trainer.rating.toFixed(1)} / 5.0</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{texts.contactInfo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{trainer.userEmail || texts.na}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{trainer.phone || texts.na}</span>
                </div>
              </CardContent>
            </Card>

            {/* Qualifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{texts.qualifications}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Training Skills (categories) */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">{texts.skills}</p>
                  {trainer.skills && trainer.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {trainer.skills.map((skill) => (
                        <span
                          key={skill.categoryId}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                          style={skill.colorCode ? {
                            backgroundColor: `${skill.colorCode}20`,
                            color: skill.colorCode,
                          } : undefined}
                        >
                          {skill.colorCode && (
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: skill.colorCode }}
                            />
                          )}
                          {getLocalizedText(skill.categoryName, locale)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{texts.noSkills}</p>
                  )}
                </div>
                <Separator />
                {/* Free-form specializations */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">{texts.specializations}</p>
                  {trainer.specializations && trainer.specializations.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {trainer.specializations.map((spec, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{texts.noSpecializations}</p>
                  )}
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">{texts.certifications}</p>
                  {trainer.certifications && trainer.certifications.length > 0 ? (
                    <div className="space-y-2">
                      {trainer.certifications.map((cert, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-amber-600" />
                          <span className="text-sm">{cert.name}</span>
                          {cert.issuedBy && (
                            <span className="text-xs text-muted-foreground">({cert.issuedBy})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{texts.noCertifications}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Compensation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{texts.compensation}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{texts.hourlyRate}:</span>
                  <span className="text-sm">{trainer.hourlyRate ? `${trainer.hourlyRate} SAR` : texts.na}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{texts.ptSessionRate}:</span>
                  <span className="text-sm">{trainer.ptSessionRate ? `${trainer.ptSessionRate} SAR` : texts.na}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">{texts.compensationModel}:</span>
                  <span className="text-sm">
                    {trainer.compensationModel
                      ? locale === "ar"
                        ? COMPENSATION_LABELS[trainer.compensationModel]?.ar
                        : COMPENSATION_LABELS[trainer.compensationModel]?.en
                      : texts.na}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PT Settings Card (full width) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{texts.ptSettings}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{texts.homeService}</p>
                    <p className="text-sm font-medium">
                      {trainer.homeServiceAvailable ? texts.yes : texts.no}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Car className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{texts.travelFee}</p>
                    <p className="text-sm font-medium">
                      {trainer.travelFeeAmount
                        ? `${trainer.travelFeeAmount} ${trainer.travelFeeCurrency || "SAR"}`
                        : texts.na}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{texts.travelRadius}</p>
                    <p className="text-sm font-medium">
                      {trainer.travelRadiusKm ? `${trainer.travelRadiusKm} ${texts.km}` : texts.na}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{texts.maxClients}</p>
                    <p className="text-sm font-medium">
                      {trainer.maxConcurrentClients ?? texts.na}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== AVAILABILITY TAB ==================== */}
        <TabsContent value="availability" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{texts.weeklySchedule}</h2>
            </div>
            <Button asChild size="sm">
              <Link href={`/${locale}/trainers/${id}/availability`}>
                <Calendar className="me-2 h-4 w-4" />
                {texts.manageAvailability}
              </Link>
            </Button>
          </div>

          {isLoadingAvailability ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !availabilitySlots || availabilitySlots.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>{texts.noAvailabilitySet}</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href={`/${locale}/trainers/${id}/availability`}>
                    {texts.manageAvailability}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {DAYS_OF_WEEK.map((day) => {
                const slots = availabilitySlots?.filter(
                  (s) => s.dayOfWeek === day.dayOfWeek && s.status !== "BLOCKED"
                ) ?? [];
                const hasSlots = slots.length > 0;

                return (
                  <Card key={day.dayOfWeek} className={hasSlots ? "" : "opacity-60"}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span>{isRTL ? day.ar : day.en}</span>
                        {hasSlots ? (
                          <Badge variant="outline" className="text-xs text-green-600">
                            {texts.available}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {texts.notAvailable}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {hasSlots ? (
                        <div className="space-y-2">
                          {slots.map((slot) => (
                            <div
                              key={slot.id}
                              className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
                            >
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{slot.startTime} - {slot.endTime}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{texts.noSlots}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ==================== SESSIONS TAB ==================== */}
        <TabsContent value="sessions" className="space-y-6">
          <h2 className="text-lg font-semibold">{texts.ptSessions}</h2>

          {isLoadingSessions ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <Loading />
                </div>
              </CardContent>
            </Card>
          ) : !ptSessions?.content || ptSessions.content.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>{texts.noSessions}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {ptSessions.content.map((session) => {
                    const statusConfig = SESSION_STATUS_LABELS[session.status] || {
                      en: session.status,
                      ar: session.status,
                      color: "bg-muted",
                    };

                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/${locale}/sessions/${session.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {getLocalizedText(session.className, locale)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(session.date, locale)} &middot; {session.startTime} - {session.endTime}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {session.ptLocationType && (
                            <Badge variant="outline" className="text-xs">
                              {session.ptLocationType === "HOME" ? (
                                <><Home className="me-1 h-3 w-3" />{isRTL ? "منزل" : "Home"}</>
                              ) : (
                                <><MapPin className="me-1 h-3 w-3" />{isRTL ? "النادي" : "Club"}</>
                              )}
                            </Badge>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {isRTL ? statusConfig.ar : statusConfig.en}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== CLIENTS TAB ==================== */}
        <TabsContent value="clients" className="space-y-6">
          <h2 className="text-lg font-semibold">{texts.activeClients}</h2>
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{texts.noClients}</p>
              <p className="text-xs mt-2">{texts.clientsComingSoon}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
