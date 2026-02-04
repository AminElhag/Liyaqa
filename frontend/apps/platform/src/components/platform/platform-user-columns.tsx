"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Eye,
  Edit,
  UserX,
  UserCheck,
  KeyRound,
  Clock,
  Mail,
  User,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { PlatformUserStatusBadge } from "./platform-user-status-badge";
import { PlatformUserRoleBadge } from "./platform-user-role-badge";
import type { PlatformUserSummary } from "@liyaqa/shared/types/platform/platform-user";

/**
 * Options for configuring platform user columns.
 */
export interface PlatformUserColumnsOptions {
  locale: string;
  onView: (user: PlatformUserSummary) => void;
  onEdit: (user: PlatformUserSummary) => void;
  onActivate: (user: PlatformUserSummary) => void;
  onSuspend: (user: PlatformUserSummary) => void;
  onResetPassword: (user: PlatformUserSummary) => void;
  canEdit?: boolean;
}

/**
 * Format relative time for display.
 */
function formatRelativeTime(dateString: string | undefined, locale: string): string {
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

/**
 * Format date for display.
 */
function formatDate(dateString: string, locale: string): string {
  return new Date(dateString).toLocaleDateString(
    locale === "ar" ? "ar-SA" : "en-SA",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

/**
 * Creates column definitions for the platform users DataTable.
 */
export function getPlatformUserColumns(
  options: PlatformUserColumnsOptions
): ColumnDef<PlatformUserSummary>[] {
  const {
    locale,
    onView,
    onEdit,
    onActivate,
    onSuspend,
    onResetPassword,
    canEdit = true,
  } = options;

  const texts = {
    name: locale === "ar" ? "الاسم" : "Name",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    role: locale === "ar" ? "الدور" : "Role",
    status: locale === "ar" ? "الحالة" : "Status",
    lastLogin: locale === "ar" ? "آخر تسجيل دخول" : "Last Login",
    createdAt: locale === "ar" ? "تاريخ الإنشاء" : "Created At",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    edit: locale === "ar" ? "تعديل" : "Edit",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    suspend: locale === "ar" ? "إيقاف" : "Suspend",
    resetPassword: locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password",
  };

  return [
    {
      accessorKey: "displayNameEn",
      header: texts.name,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">
              {locale === "ar"
                ? row.original.displayNameAr || row.original.displayNameEn
                : row.original.displayNameEn}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: texts.email,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: texts.role,
      cell: ({ row }) => <PlatformUserRoleBadge role={row.original.role} showIcon />,
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => <PlatformUserStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "lastLoginAt",
      header: texts.lastLogin,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(row.original.lastLoginAt, locale)}</span>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: texts.createdAt,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt, locale)}
        </span>
      ),
    },
    {
      id: "actions",
      header: texts.actions,
      cell: ({ row }) => {
        const user = row.original;
        const canActivate = user.status !== "ACTIVE";
        const canSuspend = user.status === "ACTIVE";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{texts.actions}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={locale === "ar" ? "start" : "end"}>
              <DropdownMenuLabel>{texts.actions}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView(user)}>
                <Eye className="me-2 h-4 w-4" />
                {texts.view}
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canEdit && canActivate && (
                <DropdownMenuItem onClick={() => onActivate(user)}>
                  <UserCheck className="me-2 h-4 w-4 text-green-600" />
                  {texts.activate}
                </DropdownMenuItem>
              )}
              {canEdit && canSuspend && (
                <DropdownMenuItem onClick={() => onSuspend(user)}>
                  <UserX className="me-2 h-4 w-4 text-red-600" />
                  {texts.suspend}
                </DropdownMenuItem>
              )}
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onResetPassword(user)}>
                    <KeyRound className="me-2 h-4 w-4 text-amber-600" />
                    {texts.resetPassword}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
