"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users,
  Briefcase,
  CreditCard,
  FileText,
  FileSignature,
  KeyRound,
  Copy,
  ExternalLink,
  Loader2,
  Clock,
  Mail,
  User,
  Check,
  Edit,
  CheckCircle,
  XCircle,
  MapPin,
  Tag,
} from "lucide-react";

import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@liyaqa/shared/components/ui/tabs";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { ResetPasswordDialog } from "@/components/platform/reset-password-dialog";
import {
  ClubLocationsTab,
  ClubMembershipPlansTab,
  ClubEditDialog,
  ClubAgreementsTab,
} from "@/components/platform/club-detail";

import {
  useClubDetail,
  useClubUsers,
  useClubEmployees,
  useClubSubscriptions,
  useClubAuditLogs,
  useResetUserPassword,
  useAuditActions,
  useUpdateClub,
  useActivateClub,
  useSuspendClub,
} from "@liyaqa/shared/queries/platform";
import type {
  ClubUser,
  ClubEmployee,
  ClubSubscription,
  ClubAuditLog,
  AuditAction,
  UpdateClubRequest,
} from "@liyaqa/shared/types/platform";
import type { ColumnDef } from "@tanstack/react-table";

// ============================================
// Status Badge Components
// ============================================

function UserStatusBadge({ status, locale }: { status: string; locale: string }) {
  const config: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ACTIVE: { label: "Active", labelAr: "نشط", variant: "default" },
    INACTIVE: { label: "Inactive", labelAr: "غير نشط", variant: "secondary" },
    LOCKED: { label: "Locked", labelAr: "مقفل", variant: "destructive" },
    PENDING_VERIFICATION: { label: "Pending", labelAr: "معلق", variant: "outline" },
  };
  const c = config[status] || { label: status, labelAr: status, variant: "outline" as const };
  return <Badge variant={c.variant}>{locale === "ar" ? c.labelAr : c.label}</Badge>;
}

function RoleBadge({ role, locale }: { role: string; locale: string }) {
  const config: Record<string, { label: string; labelAr: string; color: string }> = {
    SUPER_ADMIN: { label: "Super Admin", labelAr: "مدير عام", color: "bg-purple-100 text-purple-700" },
    CLUB_ADMIN: { label: "Club Admin", labelAr: "مدير النادي", color: "bg-blue-100 text-blue-700" },
    STAFF: { label: "Staff", labelAr: "موظف", color: "bg-green-100 text-green-700" },
    MEMBER: { label: "Member", labelAr: "عضو", color: "bg-slate-100 text-slate-700" },
  };
  const c = config[role] || { label: role, labelAr: role, color: "bg-slate-100 text-slate-700" };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>
      {locale === "ar" ? c.labelAr : c.label}
    </span>
  );
}

function EmployeeStatusBadge({ status, locale }: { status: string; locale: string }) {
  const config: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ACTIVE: { label: "Active", labelAr: "نشط", variant: "default" },
    INACTIVE: { label: "Inactive", labelAr: "غير نشط", variant: "secondary" },
    ON_LEAVE: { label: "On Leave", labelAr: "في إجازة", variant: "outline" },
    PROBATION: { label: "Probation", labelAr: "تجريبي", variant: "outline" },
    TERMINATED: { label: "Terminated", labelAr: "منتهي", variant: "destructive" },
  };
  const c = config[status] || { label: status, labelAr: status, variant: "outline" as const };
  return <Badge variant={c.variant}>{locale === "ar" ? c.labelAr : c.label}</Badge>;
}

function SubscriptionStatusBadge({ status, locale }: { status: string; locale: string }) {
  const config: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ACTIVE: { label: "Active", labelAr: "نشط", variant: "default" },
    PENDING_PAYMENT: { label: "Pending", labelAr: "معلق", variant: "outline" },
    FROZEN: { label: "Frozen", labelAr: "مجمد", variant: "secondary" },
    CANCELLED: { label: "Cancelled", labelAr: "ملغي", variant: "destructive" },
    EXPIRED: { label: "Expired", labelAr: "منتهي", variant: "destructive" },
  };
  const c = config[status] || { label: status, labelAr: status, variant: "outline" as const };
  return <Badge variant={c.variant}>{locale === "ar" ? c.labelAr : c.label}</Badge>;
}

function ClubStatusBadge({ status, locale }: { status: string; locale: string }) {
  const config: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING: { label: "Pending", labelAr: "معلق", variant: "outline" },
    ACTIVE: { label: "Active", labelAr: "نشط", variant: "default" },
    SUSPENDED: { label: "Suspended", labelAr: "موقوف", variant: "destructive" },
    CLOSED: { label: "Closed", labelAr: "مغلق", variant: "secondary" },
  };
  const c = config[status] || { label: status, labelAr: status, variant: "outline" as const };
  return <Badge variant={c.variant}>{locale === "ar" ? c.labelAr : c.label}</Badge>;
}

// ============================================
// Main Page Component
// ============================================

export default function ClubDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const clubId = params.id as string;
  const clientId = searchParams.get("clientId");
  const locale = (params.locale as string) || "en";

  const [activeTab, setActiveTab] = useState("overview");
  const [usersPage, setUsersPage] = useState(0);
  const [employeesPage, setEmployeesPage] = useState(0);
  const [subscriptionsPage, setSubscriptionsPage] = useState(0);
  const [auditLogsPage, setAuditLogsPage] = useState(0);
  const [auditActionFilter, setAuditActionFilter] = useState<AuditAction | "all">("all");
  const [copiedId, setCopiedId] = useState(false);

  // Password reset dialog state
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClubUser | null>(null);
  const [copiedSubdomain, setCopiedSubdomain] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Auth state
  const { user } = useAuthStore();
  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";

  // Get dynamic base domain from current location
  const getBaseDomain = () => {
    if (typeof window === "undefined") return "liyaqa.com";
    const { hostname, port } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "liyaqa.local";
    }
    // Extract base domain (e.g., "liyaqa.com" from "platform.liyaqa.com")
    const parts = hostname.split(".");
    return parts.length > 2 ? parts.slice(-2).join(".") : hostname + (port && port !== "80" && port !== "443" ? `:${port}` : "");
  };

  const getSubdomainUrl = (slug: string) => {
    if (typeof window === "undefined") return `https://${slug}.liyaqa.com`;
    const { protocol, hostname, port } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://${slug}.liyaqa.local:3000`;
    }
    const baseDomain = getBaseDomain();
    const portPart = port && port !== "80" && port !== "443" ? `:${port}` : "";
    return `${protocol}//${slug}.${baseDomain}${portPart}`;
  };

  // Queries
  const { data: clubDetail, isLoading: clubLoading } = useClubDetail(clubId);
  const { data: usersData, isLoading: usersLoading } = useClubUsers(clubId, { page: usersPage, size: 10 });
  const { data: employeesData, isLoading: employeesLoading } = useClubEmployees(clubId, { page: employeesPage, size: 10 });
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useClubSubscriptions(clubId, { page: subscriptionsPage, size: 10 });
  const { data: auditLogsData, isLoading: auditLogsLoading } = useClubAuditLogs(
    clubId,
    { page: auditLogsPage, size: 10, action: auditActionFilter === "all" ? undefined : auditActionFilter }
  );
  const { data: auditActions } = useAuditActions();

  // Mutations
  const resetPasswordMutation = useResetUserPassword(clubId);
  const updateClubMutation = useUpdateClub(clubId);
  const activateClubMutation = useActivateClub(clubId);
  const suspendClubMutation = useSuspendClub(clubId);

  // Texts
  const texts = {
    backToClient: locale === "ar" ? "العودة إلى العميل" : "Back to Client",
    clubDetails: locale === "ar" ? "تفاصيل النادي" : "Club Details",
    tenantId: locale === "ar" ? "معرف المستأجر" : "Tenant ID",
    subdomain: locale === "ar" ? "النطاق الفرعي" : "Subdomain",
    created: locale === "ar" ? "تاريخ الإنشاء" : "Created",
    overview: locale === "ar" ? "نظرة عامة" : "Overview",
    users: locale === "ar" ? "المستخدمون" : "Users",
    employees: locale === "ar" ? "الموظفون" : "Employees",
    subscriptions: locale === "ar" ? "الاشتراكات" : "Subscriptions",
    auditLogs: locale === "ar" ? "سجلات المراجعة" : "Audit Logs",
    totalUsers: locale === "ar" ? "إجمالي المستخدمين" : "Total Users",
    activeUsers: locale === "ar" ? "المستخدمون النشطون" : "Active Users",
    totalEmployees: locale === "ar" ? "إجمالي الموظفين" : "Total Employees",
    activeEmployees: locale === "ar" ? "الموظفون النشطون" : "Active Employees",
    totalSubscriptions: locale === "ar" ? "إجمالي الاشتراكات" : "Total Subscriptions",
    activeSubscriptions: locale === "ar" ? "الاشتراكات النشطة" : "Active Subscriptions",
    name: locale === "ar" ? "الاسم" : "Name",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    role: locale === "ar" ? "الدور" : "Role",
    status: locale === "ar" ? "الحالة" : "Status",
    lastLogin: locale === "ar" ? "آخر تسجيل دخول" : "Last Login",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    resetPassword: locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password",
    employmentType: locale === "ar" ? "نوع التوظيف" : "Employment Type",
    hireDate: locale === "ar" ? "تاريخ التوظيف" : "Hire Date",
    plan: locale === "ar" ? "الخطة" : "Plan",
    startDate: locale === "ar" ? "تاريخ البدء" : "Start Date",
    endDate: locale === "ar" ? "تاريخ الانتهاء" : "End Date",
    daysRemaining: locale === "ar" ? "الأيام المتبقية" : "Days Remaining",
    action: locale === "ar" ? "الإجراء" : "Action",
    entityType: locale === "ar" ? "نوع الكيان" : "Entity Type",
    user: locale === "ar" ? "المستخدم" : "User",
    description: locale === "ar" ? "الوصف" : "Description",
    timestamp: locale === "ar" ? "الوقت" : "Timestamp",
    filterByAction: locale === "ar" ? "تصفية حسب الإجراء" : "Filter by Action",
    allActions: locale === "ar" ? "جميع الإجراءات" : "All Actions",
    noData: locale === "ar" ? "لا توجد بيانات" : "No data available",
    copied: locale === "ar" ? "تم النسخ" : "Copied",
    passwordResetSuccess: locale === "ar" ? "تم إعادة تعيين كلمة المرور بنجاح" : "Password reset successfully",
    passwordResetError: locale === "ar" ? "فشل إعادة تعيين كلمة المرور" : "Failed to reset password",
    locations: locale === "ar" ? "المواقع" : "Locations",
    membershipPlans: locale === "ar" ? "خطط العضوية" : "Membership Plans",
    agreements: locale === "ar" ? "الاتفاقيات" : "Agreements",
    editClub: locale === "ar" ? "تعديل النادي" : "Edit Club",
    activateClub: locale === "ar" ? "تفعيل النادي" : "Activate",
    suspendClub: locale === "ar" ? "تعليق النادي" : "Suspend",
    clubUpdated: locale === "ar" ? "تم تحديث النادي بنجاح" : "Club updated successfully",
    clubActivated: locale === "ar" ? "تم تفعيل النادي بنجاح" : "Club activated successfully",
    clubSuspended: locale === "ar" ? "تم تعليق النادي بنجاح" : "Club suspended successfully",
    actionFailed: locale === "ar" ? "فشل في تنفيذ الإجراء" : "Action failed",
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Handle password reset
  const handleResetPassword = async (password: string) => {
    if (!selectedUser) return;
    try {
      await resetPasswordMutation.mutateAsync({
        userId: selectedUser.id,
        data: { newPassword: password },
      });
      toast({
        title: texts.passwordResetSuccess,
        description: selectedUser.email,
      });
      setResetPasswordOpen(false);
      setSelectedUser(null);
    } catch {
      toast({
        title: texts.passwordResetError,
        variant: "destructive",
      });
    }
  };

  // Handle club update
  const handleUpdateClub = async (data: UpdateClubRequest) => {
    try {
      await updateClubMutation.mutateAsync(data);
      toast({ title: texts.clubUpdated });
      setEditDialogOpen(false);
    } catch {
      toast({ title: texts.actionFailed, variant: "destructive" });
    }
  };

  // Handle club activate
  const handleActivateClub = async () => {
    try {
      await activateClubMutation.mutateAsync();
      toast({ title: texts.clubActivated });
    } catch {
      toast({ title: texts.actionFailed, variant: "destructive" });
    }
  };

  // Handle club suspend
  const handleSuspendClub = async () => {
    try {
      await suspendClubMutation.mutateAsync();
      toast({ title: texts.clubSuspended });
    } catch {
      toast({ title: texts.actionFailed, variant: "destructive" });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString: string | undefined) => {
    if (!dateString) return locale === "ar" ? "لم يسجل" : "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return locale === "ar" ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0) return locale === "ar" ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    return locale === "ar" ? "الآن" : "Just now";
  };

  // User columns
  const userColumns: ColumnDef<ClubUser>[] = [
    {
      accessorKey: "displayName",
      header: texts.name,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span>{locale === "ar" ? row.original.displayName.ar || row.original.displayName.en : row.original.displayName.en}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: texts.email,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Mail className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: texts.role,
      cell: ({ row }) => <RoleBadge role={row.original.role} locale={locale} />,
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => <UserStatusBadge status={row.original.status} locale={locale} />,
    },
    {
      accessorKey: "lastLoginAt",
      header: texts.lastLogin,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(row.original.lastLoginAt)}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedUser(row.original);
            setResetPasswordOpen(true);
          }}
        >
          <KeyRound className="h-4 w-4 me-1" />
          {texts.resetPassword}
        </Button>
      ),
    },
  ];

  // Employee columns
  const employeeColumns: ColumnDef<ClubEmployee>[] = [
    {
      accessorKey: "name",
      header: texts.name,
      cell: ({ row }) => {
        const firstName = locale === "ar" ? row.original.firstName.ar || row.original.firstName.en : row.original.firstName.en;
        const lastName = locale === "ar" ? row.original.lastName.ar || row.original.lastName.en : row.original.lastName.en;
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-green-600" />
            </div>
            <span>{`${firstName} ${lastName}`}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: texts.email,
      cell: ({ row }) => row.original.email || "-",
    },
    {
      accessorKey: "employmentType",
      header: texts.employmentType,
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.employmentType.replace("_", " ")}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => <EmployeeStatusBadge status={row.original.status} locale={locale} />,
    },
    {
      accessorKey: "hireDate",
      header: texts.hireDate,
      cell: ({ row }) => formatDate(row.original.hireDate),
    },
  ];

  // Subscription columns
  const subscriptionColumns: ColumnDef<ClubSubscription>[] = [
    {
      accessorKey: "memberId",
      header: locale === "ar" ? "العضو" : "Member",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.memberId.slice(0, 8)}...</span>
      ),
    },
    {
      accessorKey: "planId",
      header: texts.plan,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.planId.slice(0, 8)}...</span>
      ),
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => <SubscriptionStatusBadge status={row.original.status} locale={locale} />,
    },
    {
      accessorKey: "startDate",
      header: texts.startDate,
      cell: ({ row }) => formatDate(row.original.startDate),
    },
    {
      accessorKey: "endDate",
      header: texts.endDate,
      cell: ({ row }) => formatDate(row.original.endDate),
    },
    {
      accessorKey: "daysRemaining",
      header: texts.daysRemaining,
      cell: ({ row }) => (
        <Badge variant={row.original.daysRemaining > 30 ? "default" : row.original.daysRemaining > 7 ? "secondary" : "destructive"}>
          {row.original.daysRemaining} {locale === "ar" ? "يوم" : "days"}
        </Badge>
      ),
    },
  ];

  // Audit log columns
  const auditLogColumns: ColumnDef<ClubAuditLog>[] = [
    {
      accessorKey: "action",
      header: texts.action,
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.action}</Badge>
      ),
    },
    {
      accessorKey: "entityType",
      header: texts.entityType,
      cell: ({ row }) => row.original.entityType,
    },
    {
      accessorKey: "userEmail",
      header: texts.user,
      cell: ({ row }) => row.original.userEmail || "-",
    },
    {
      accessorKey: "description",
      header: texts.description,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {row.original.description || "-"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: texts.timestamp,
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleString(locale === "ar" ? "ar-SA" : "en-SA")}
        </div>
      ),
    },
  ];

  if (clubLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!clubDetail) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-muted-foreground">{texts.noData}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {clientId && (
          <Link href={`/${locale}/clients/${clientId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 me-2" />
              {texts.backToClient}
            </Button>
          </Link>
        )}
      </div>

      {/* Club Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {locale === "ar" ? clubDetail.name.ar || clubDetail.name.en : clubDetail.name.en}
                </CardTitle>
                <CardDescription>
                  {clubDetail.description && (locale === "ar" ? clubDetail.description.ar || clubDetail.description.en : clubDetail.description.en)}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ClubStatusBadge status={clubDetail.status} locale={locale} />
              {isPlatformAdmin && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 me-1" />
                    {texts.editClub}
                  </Button>
                  {clubDetail.status === "SUSPENDED" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleActivateClub}
                      disabled={activateClubMutation.isPending}
                    >
                      {activateClubMutation.isPending ? (
                        <Loader2 className="h-4 w-4 me-1 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 me-1" />
                      )}
                      {texts.activateClub}
                    </Button>
                  )}
                  {clubDetail.status === "ACTIVE" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleSuspendClub}
                      disabled={suspendClubMutation.isPending}
                    >
                      {suspendClubMutation.isPending ? (
                        <Loader2 className="h-4 w-4 me-1 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 me-1" />
                      )}
                      {texts.suspendClub}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tenant ID */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">{texts.tenantId}:</span>
              <code className="text-xs font-mono">{clubDetail.id.slice(0, 8)}...</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(clubDetail.id)}
              >
                {copiedId ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>

            {/* Subdomain */}
            {clubDetail.slug && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">{texts.subdomain}:</span>
                <code className="text-xs font-mono">{clubDetail.slug}.{getBaseDomain()}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    navigator.clipboard.writeText(getSubdomainUrl(clubDetail.slug!));
                    setCopiedSubdomain(true);
                    setTimeout(() => setCopiedSubdomain(false), 2000);
                  }}
                >
                  {copiedSubdomain ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  asChild
                >
                  <a href={getSubdomainUrl(clubDetail.slug)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            )}

            {/* Created Date */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">{texts.created}:</span>
              <span className="text-sm">{formatDate(clubDetail.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap gap-1">
          <TabsTrigger value="overview" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.overview}</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.users}</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.employees}</span>
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.subscriptions}</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.locations}</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.membershipPlans}</span>
          </TabsTrigger>
          <TabsTrigger value="agreements" className="gap-2">
            <FileSignature className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.agreements}</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.auditLogs}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{texts.totalUsers}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clubDetail.stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {clubDetail.stats.activeUsers} {texts.activeUsers.toLowerCase()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{texts.totalEmployees}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clubDetail.stats.totalEmployees}</div>
                <p className="text-xs text-muted-foreground">
                  {clubDetail.stats.activeEmployees} {texts.activeEmployees.toLowerCase()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{texts.totalSubscriptions}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clubDetail.stats.totalSubscriptions}</div>
                <p className="text-xs text-muted-foreground">
                  {clubDetail.stats.activeSubscriptions} {texts.activeSubscriptions.toLowerCase()}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{texts.users}</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : usersData?.content.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{texts.noData}</p>
              ) : (
                <DataTable
                  columns={userColumns}
                  data={usersData?.content || []}
                  pageCount={usersData?.totalPages || 1}
                  pageIndex={usersPage}
                  onPageChange={setUsersPage}
                  manualPagination
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>{texts.employees}</CardTitle>
            </CardHeader>
            <CardContent>
              {employeesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : employeesData?.content.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{texts.noData}</p>
              ) : (
                <DataTable
                  columns={employeeColumns}
                  data={employeesData?.content || []}
                  pageCount={employeesData?.totalPages || 1}
                  pageIndex={employeesPage}
                  onPageChange={setEmployeesPage}
                  manualPagination
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>{texts.subscriptions}</CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : subscriptionsData?.content.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{texts.noData}</p>
              ) : (
                <DataTable
                  columns={subscriptionColumns}
                  data={subscriptionsData?.content || []}
                  pageCount={subscriptionsData?.totalPages || 1}
                  pageIndex={subscriptionsPage}
                  onPageChange={setSubscriptionsPage}
                  manualPagination
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations">
          <ClubLocationsTab clubId={clubId} locale={locale} />
        </TabsContent>

        {/* Membership Plans Tab */}
        <TabsContent value="plans">
          <ClubMembershipPlansTab clubId={clubId} locale={locale} />
        </TabsContent>

        {/* Agreements Tab */}
        <TabsContent value="agreements">
          <ClubAgreementsTab clubId={clubId} locale={locale} />
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{texts.auditLogs}</CardTitle>
                <Select
                  value={auditActionFilter}
                  onValueChange={(v) => {
                    setAuditActionFilter(v as AuditAction | "all");
                    setAuditLogsPage(0);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={texts.filterByAction} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{texts.allActions}</SelectItem>
                    {auditActions?.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {auditLogsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : auditLogsData?.content.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{texts.noData}</p>
              ) : (
                <DataTable
                  columns={auditLogColumns}
                  data={auditLogsData?.content || []}
                  pageCount={auditLogsData?.totalPages || 1}
                  pageIndex={auditLogsPage}
                  onPageChange={setAuditLogsPage}
                  manualPagination
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Password Dialog */}
      {selectedUser && (
        <ResetPasswordDialog
          open={resetPasswordOpen}
          onOpenChange={setResetPasswordOpen}
          userEmail={selectedUser.email}
          userName={locale === "ar" ? selectedUser.displayName.ar || selectedUser.displayName.en : selectedUser.displayName.en}
          locale={locale}
          onSubmit={handleResetPassword}
          isLoading={resetPasswordMutation.isPending}
        />
      )}

      {/* Edit Club Dialog */}
      <ClubEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        club={clubDetail}
        locale={locale}
        onSubmit={handleUpdateClub}
        isLoading={updateClubMutation.isPending}
      />
    </div>
  );
}
