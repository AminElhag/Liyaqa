"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  FileText,
  FileSignature,
  Copy,
  ExternalLink,
  Loader2,
  Check,
  Edit,
  CheckCircle,
  XCircle,
  Tag,
  Users,
  User,
  UserPlus,
  MoreHorizontal,
  KeyRound,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import {
  ClubLocationsTab,
  ClubMembershipPlansTab,
  ClubEditDialog,
  ClubAgreementsTab,
} from "@liyaqa/shared/components/platform/club-detail";

import {
  useClubDetail,
  useClubUsers,
  useCreateClubUser,
  useUpdateClubUser,
  useResetUserPassword,
  useClubSubscriptions,
  useClubAuditLogs,
  useAuditActions,
  useUpdateClub,
  useActivateClub,
  useSuspendClub,
} from "@liyaqa/shared/queries/platform";
import type {
  ClubUser,
  ClubSubscription,
  ClubAuditLog,
  AuditAction,
  UpdateClubRequest,
  UpdateClubUserRequest,
} from "@liyaqa/shared/types/platform";
import type { ColumnDef } from "@tanstack/react-table";

// ============================================
// Status Badge Components
// ============================================

function UserStatusBadge({ status, locale }: { status: string; locale: string }) {
  const config: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ACTIVE: { label: "Active", labelAr: "\u0646\u0634\u0637", variant: "default" },
    INACTIVE: { label: "Inactive", labelAr: "\u063a\u064a\u0631 \u0646\u0634\u0637", variant: "secondary" },
    LOCKED: { label: "Locked", labelAr: "\u0645\u0642\u0641\u0644", variant: "destructive" },
    PENDING_VERIFICATION: { label: "Pending", labelAr: "\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u062a\u062d\u0642\u0642", variant: "outline" },
  };
  const c = config[status] || { label: status, labelAr: status, variant: "outline" as const };
  return <Badge variant={c.variant}>{locale === "ar" ? c.labelAr : c.label}</Badge>;
}

function UserRoleBadge({ role, locale }: { role: string; locale: string }) {
  const config: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    SUPER_ADMIN: { label: "Super Admin", labelAr: "\u0645\u0633\u0624\u0648\u0644 \u0623\u0639\u0644\u0649", variant: "destructive" },
    CLUB_ADMIN: { label: "Club Admin", labelAr: "\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0646\u0627\u062f\u064a", variant: "default" },
    STAFF: { label: "Staff", labelAr: "\u0645\u0648\u0638\u0641", variant: "secondary" },
    TRAINER: { label: "Trainer", labelAr: "\u0645\u062f\u0631\u0628", variant: "outline" },
    MEMBER: { label: "Member", labelAr: "\u0639\u0636\u0648", variant: "outline" },
  };
  const c = config[role] || { label: role, labelAr: role, variant: "outline" as const };
  return <Badge variant={c.variant}>{locale === "ar" ? c.labelAr : c.label}</Badge>;
}

function SubscriptionStatusBadge({ status, locale }: { status: string; locale: string }) {
  const config: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ACTIVE: { label: "Active", labelAr: "\u0646\u0634\u0637", variant: "default" },
    PENDING_PAYMENT: { label: "Pending", labelAr: "\u0645\u0639\u0644\u0642", variant: "outline" },
    FROZEN: { label: "Frozen", labelAr: "\u0645\u062c\u0645\u062f", variant: "secondary" },
    CANCELLED: { label: "Cancelled", labelAr: "\u0645\u0644\u063a\u064a", variant: "destructive" },
    EXPIRED: { label: "Expired", labelAr: "\u0645\u0646\u062a\u0647\u064a", variant: "destructive" },
  };
  const c = config[status] || { label: status, labelAr: status, variant: "outline" as const };
  return <Badge variant={c.variant}>{locale === "ar" ? c.labelAr : c.label}</Badge>;
}

function ClubStatusBadge({ status, locale }: { status: string; locale: string }) {
  const config: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING: { label: "Pending", labelAr: "\u0645\u0639\u0644\u0642", variant: "outline" },
    ACTIVE: { label: "Active", labelAr: "\u0646\u0634\u0637", variant: "default" },
    SUSPENDED: { label: "Suspended", labelAr: "\u0645\u0648\u0642\u0648\u0641", variant: "destructive" },
    CLOSED: { label: "Closed", labelAr: "\u0645\u063a\u0644\u0642", variant: "secondary" },
  };
  const c = config[status] || { label: status, labelAr: status, variant: "outline" as const };
  return <Badge variant={c.variant}>{locale === "ar" ? c.labelAr : c.label}</Badge>;
}

// ============================================
// Add User Form Schema
// ============================================

const addUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  displayNameEn: z.string().min(1, "Display name is required"),
  displayNameAr: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "CLUB_ADMIN", "STAFF", "TRAINER", "MEMBER"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm the password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type AddUserFormValues = z.infer<typeof addUserSchema>;

const editUserSchema = z.object({
  displayNameEn: z.string().min(1, "Display name is required"),
  displayNameAr: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "CLUB_ADMIN", "STAFF", "TRAINER", "MEMBER"]),
  status: z.enum(["ACTIVE", "INACTIVE", "LOCKED"]),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm the password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

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
  const [subscriptionsPage, setSubscriptionsPage] = useState(0);
  const [auditLogsPage, setAuditLogsPage] = useState(0);
  const [auditActionFilter, setAuditActionFilter] = useState<AuditAction | "all">("all");
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSubdomain, setCopiedSubdomain] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Add user dialog state
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  // Edit user dialog state
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ClubUser | null>(null);

  // Reset password dialog state
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<ClubUser | null>(null);

  // Auth state
  const { user } = useAuthStore();
  const isPlatformAdmin = user?.role === "PLATFORM_SUPER_ADMIN" || user?.role === "PLATFORM_ADMIN";

  // Get dynamic base domain from current location
  const getBaseDomain = () => {
    if (typeof window === "undefined") return "liyaqa.com";
    const { hostname, port } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "liyaqa.local";
    }
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
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useClubSubscriptions(clubId, { page: subscriptionsPage, size: 10 });
  const { data: auditLogsData, isLoading: auditLogsLoading } = useClubAuditLogs(
    clubId,
    { page: auditLogsPage, size: 10, action: auditActionFilter === "all" ? undefined : auditActionFilter }
  );
  const { data: auditActions } = useAuditActions();

  // Mutations
  const updateClubMutation = useUpdateClub(clubId);
  const activateClubMutation = useActivateClub(clubId);
  const suspendClubMutation = useSuspendClub(clubId);
  const createUserMutation = useCreateClubUser(clubId);

  const updateUserMutation = useUpdateClubUser(clubId);
  const resetPasswordMutation = useResetUserPassword(clubId);

  // Add user form
  const addUserForm = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      email: "",
      displayNameEn: "",
      displayNameAr: "",
      role: "MEMBER",
      password: "",
      confirmPassword: "",
    },
  });

  // Edit user form
  const editUserForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      displayNameEn: "",
      displayNameAr: "",
      role: "MEMBER",
      status: "ACTIVE",
    },
  });

  // Reset password form
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Texts
  const texts = {
    backToClient: locale === "ar" ? "\u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0627\u0644\u0639\u0645\u064a\u0644" : "Back to Client",
    clubDetails: locale === "ar" ? "\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0646\u0627\u062f\u064a" : "Club Details",
    tenantId: locale === "ar" ? "\u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0633\u062a\u0623\u062c\u0631" : "Tenant ID",
    subdomain: locale === "ar" ? "\u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0641\u0631\u0639\u064a" : "Subdomain",
    created: locale === "ar" ? "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0646\u0634\u0627\u0621" : "Created",
    overview: locale === "ar" ? "\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629" : "Overview",
    users: locale === "ar" ? "\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0648\u0646" : "Users",
    subscriptions: locale === "ar" ? "\u0627\u0644\u0627\u0634\u062a\u0631\u0627\u0643\u0627\u062a" : "Subscriptions",
    auditLogs: locale === "ar" ? "\u0633\u062c\u0644\u0627\u062a \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629" : "Audit Logs",
    totalUsers: locale === "ar" ? "\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646" : "Total Users",
    activeUsers: locale === "ar" ? "\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0648\u0646 \u0627\u0644\u0646\u0634\u0637\u0648\u0646" : "Active Users",
    totalSubscriptions: locale === "ar" ? "\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0627\u0634\u062a\u0631\u0627\u0643\u0627\u062a" : "Total Subscriptions",
    activeSubscriptions: locale === "ar" ? "\u0627\u0644\u0627\u0634\u062a\u0631\u0627\u0643\u0627\u062a \u0627\u0644\u0646\u0634\u0637\u0629" : "Active Subscriptions",
    totalLocations: locale === "ar" ? "\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0648\u0627\u0642\u0639" : "Total Locations",
    name: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645" : "Name",
    email: locale === "ar" ? "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a" : "Email",
    status: locale === "ar" ? "\u0627\u0644\u062d\u0627\u0644\u0629" : "Status",
    role: locale === "ar" ? "\u0627\u0644\u062f\u0648\u0631" : "Role",
    lastLogin: locale === "ar" ? "\u0622\u062e\u0631 \u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644" : "Last Login",
    never: locale === "ar" ? "\u0644\u0645 \u064a\u062a\u0645" : "Never",
    plan: locale === "ar" ? "\u0627\u0644\u062e\u0637\u0629" : "Plan",
    startDate: locale === "ar" ? "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0628\u062f\u0621" : "Start Date",
    endDate: locale === "ar" ? "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0627\u0646\u062a\u0647\u0627\u0621" : "End Date",
    daysRemaining: locale === "ar" ? "\u0627\u0644\u0623\u064a\u0627\u0645 \u0627\u0644\u0645\u062a\u0628\u0642\u064a\u0629" : "Days Remaining",
    action: locale === "ar" ? "\u0627\u0644\u0625\u062c\u0631\u0627\u0621" : "Action",
    entityType: locale === "ar" ? "\u0646\u0648\u0639 \u0627\u0644\u0643\u064a\u0627\u0646" : "Entity Type",
    user: locale === "ar" ? "\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645" : "User",
    description: locale === "ar" ? "\u0627\u0644\u0648\u0635\u0641" : "Description",
    timestamp: locale === "ar" ? "\u0627\u0644\u0648\u0642\u062a" : "Timestamp",
    filterByAction: locale === "ar" ? "\u062a\u0635\u0641\u064a\u0629 \u062d\u0633\u0628 \u0627\u0644\u0625\u062c\u0631\u0627\u0621" : "Filter by Action",
    allActions: locale === "ar" ? "\u062c\u0645\u064a\u0639 \u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a" : "All Actions",
    noData: locale === "ar" ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a" : "No data available",
    copied: locale === "ar" ? "\u062a\u0645 \u0627\u0644\u0646\u0633\u062e" : "Copied",
    locations: locale === "ar" ? "\u0627\u0644\u0645\u0648\u0627\u0642\u0639" : "Locations",
    plansAndAgreements: locale === "ar" ? "\u0627\u0644\u062e\u0637\u0637 \u0648\u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0627\u062a" : "Plans & Agreements",
    membershipPlans: locale === "ar" ? "\u062e\u0637\u0637 \u0627\u0644\u0639\u0636\u0648\u064a\u0629" : "Membership Plans",
    agreements: locale === "ar" ? "\u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0627\u062a" : "Agreements",
    editClub: locale === "ar" ? "\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0646\u0627\u062f\u064a" : "Edit Club",
    activateClub: locale === "ar" ? "\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0646\u0627\u062f\u064a" : "Activate",
    suspendClub: locale === "ar" ? "\u062a\u0639\u0644\u064a\u0642 \u0627\u0644\u0646\u0627\u062f\u064a" : "Suspend",
    clubUpdated: locale === "ar" ? "\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0646\u0627\u062f\u064a \u0628\u0646\u062c\u0627\u062d" : "Club updated successfully",
    clubActivated: locale === "ar" ? "\u062a\u0645 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0646\u0627\u062f\u064a \u0628\u0646\u062c\u0627\u062d" : "Club activated successfully",
    clubSuspended: locale === "ar" ? "\u062a\u0645 \u062a\u0639\u0644\u064a\u0642 \u0627\u0644\u0646\u0627\u062f\u064a \u0628\u0646\u062c\u0627\u062d" : "Club suspended successfully",
    actionFailed: locale === "ar" ? "\u0641\u0634\u0644 \u0641\u064a \u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0625\u062c\u0631\u0627\u0621" : "Action failed",
    addUser: locale === "ar" ? "\u0625\u0636\u0627\u0641\u0629 \u0645\u0633\u062a\u062e\u062f\u0645" : "Add User",
    addUserTitle: locale === "ar" ? "\u0625\u0636\u0627\u0641\u0629 \u0645\u0633\u062a\u062e\u062f\u0645 \u062c\u062f\u064a\u062f" : "Add New User",
    addUserDescription: locale === "ar" ? "\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628 \u0645\u0633\u062a\u062e\u062f\u0645 \u062c\u062f\u064a\u062f \u0644\u0647\u0630\u0627 \u0627\u0644\u0646\u0627\u062f\u064a" : "Create a new user account for this club",
    displayNameEn: locale === "ar" ? "\u0627\u0633\u0645 \u0627\u0644\u0639\u0631\u0636 (\u0625\u0646\u062c\u0644\u064a\u0632\u064a)" : "Display Name (English)",
    displayNameAr: locale === "ar" ? "\u0627\u0633\u0645 \u0627\u0644\u0639\u0631\u0636 (\u0639\u0631\u0628\u064a)" : "Display Name (Arabic)",
    password: locale === "ar" ? "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" : "Password",
    confirmPassword: locale === "ar" ? "\u062a\u0623\u0643\u064a\u062f \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" : "Confirm Password",
    cancel: locale === "ar" ? "\u0625\u0644\u063a\u0627\u0621" : "Cancel",
    creating: locale === "ar" ? "\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0646\u0634\u0627\u0621..." : "Creating...",
    userCreated: locale === "ar" ? "\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0628\u0646\u062c\u0627\u062d" : "User created successfully",
    selectRole: locale === "ar" ? "\u0627\u062e\u062a\u0631 \u0627\u0644\u062f\u0648\u0631" : "Select role",
    editUser: locale === "ar" ? "\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645" : "Edit User",
    editUserTitle: locale === "ar" ? "\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645" : "Edit User",
    editUserDescription: locale === "ar" ? "\u062a\u0639\u062f\u064a\u0644 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645" : "Update user display name, role, or status",
    resetPassword: locale === "ar" ? "\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" : "Reset Password",
    resetPasswordTitle: locale === "ar" ? "\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" : "Reset Password",
    resetPasswordDescription: locale === "ar" ? "\u062a\u0639\u064a\u064a\u0646 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u062c\u062f\u064a\u062f\u0629 \u0644\u0644\u0645\u0633\u062a\u062e\u062f\u0645" : "Set a new password for this user",
    newPassword: locale === "ar" ? "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062c\u062f\u064a\u062f\u0629" : "New Password",
    save: locale === "ar" ? "\u062d\u0641\u0638" : "Save",
    saving: locale === "ar" ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062d\u0641\u0638..." : "Saving...",
    resetting: locale === "ar" ? "\u062c\u0627\u0631\u064a \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0639\u064a\u064a\u0646..." : "Resetting...",
    actions: locale === "ar" ? "\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a" : "Actions",
    selectStatus: locale === "ar" ? "\u0627\u062e\u062a\u0631 \u0627\u0644\u062d\u0627\u0644\u0629" : "Select status",
    active: locale === "ar" ? "\u0646\u0634\u0637" : "Active",
    inactive: locale === "ar" ? "\u063a\u064a\u0631 \u0646\u0634\u0637" : "Inactive",
    locked: locale === "ar" ? "\u0645\u0642\u0641\u0644" : "Locked",
    userUpdated: locale === "ar" ? "\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0628\u0646\u062c\u0627\u062d" : "User updated successfully",
    passwordReset: locale === "ar" ? "\u062a\u0645 \u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0628\u0646\u062c\u0627\u062d" : "Password reset successfully",
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
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

  // Handle add user
  const handleAddUser = async (data: AddUserFormValues) => {
    try {
      await createUserMutation.mutateAsync({
        email: data.email,
        password: data.password,
        displayNameEn: data.displayNameEn,
        displayNameAr: data.displayNameAr || undefined,
        role: data.role,
      });
      toast({ title: texts.userCreated });
      setAddUserDialogOpen(false);
      addUserForm.reset();
    } catch {
      toast({ title: texts.actionFailed, variant: "destructive" });
    }
  };

  // Handle open edit user dialog
  const handleOpenEditUser = (user: ClubUser) => {
    setEditingUser(user);
    editUserForm.reset({
      displayNameEn: user.displayName.en,
      displayNameAr: user.displayName.ar || "",
      role: user.role as EditUserFormValues["role"],
      status: user.status as EditUserFormValues["status"],
    });
    setEditUserDialogOpen(true);
  };

  // Handle edit user submit
  const handleEditUser = async (data: EditUserFormValues) => {
    if (!editingUser) return;
    try {
      await updateUserMutation.mutateAsync({
        userId: editingUser.id,
        data: {
          displayNameEn: data.displayNameEn,
          displayNameAr: data.displayNameAr || undefined,
          role: data.role,
          status: data.status,
        } as UpdateClubUserRequest,
      });
      toast({ title: texts.userUpdated });
      setEditUserDialogOpen(false);
      setEditingUser(null);
    } catch {
      toast({ title: texts.actionFailed, variant: "destructive" });
    }
  };

  // Handle open reset password dialog
  const handleOpenResetPassword = (user: ClubUser) => {
    setResetPasswordUser(user);
    resetPasswordForm.reset({ newPassword: "", confirmPassword: "" });
    setResetPasswordDialogOpen(true);
  };

  // Handle reset password submit
  const handleResetPassword = async (data: ResetPasswordFormValues) => {
    if (!resetPasswordUser) return;
    try {
      await resetPasswordMutation.mutateAsync({
        userId: resetPasswordUser.id,
        data: { newPassword: data.newPassword },
      });
      toast({ title: texts.passwordReset });
      setResetPasswordDialogOpen(false);
      setResetPasswordUser(null);
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

  // User columns
  const userColumns: ColumnDef<ClubUser>[] = [
    {
      accessorKey: "displayName",
      header: texts.name,
      cell: ({ row }) => {
        const name = locale === "ar"
          ? row.original.displayName.ar || row.original.displayName.en
          : row.original.displayName.en;
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <User className="h-4 w-4 text-green-600" />
            </div>
            <span>{name}</span>
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
      accessorKey: "role",
      header: texts.role,
      cell: ({ row }) => <UserRoleBadge role={row.original.role} locale={locale} />,
    },
    {
      accessorKey: "status",
      header: texts.status,
      cell: ({ row }) => <UserStatusBadge status={row.original.status} locale={locale} />,
    },
    {
      accessorKey: "lastLoginAt",
      header: texts.lastLogin,
      cell: ({ row }) =>
        row.original.lastLoginAt ? formatDate(row.original.lastLoginAt) : texts.never,
    },
    ...(isPlatformAdmin
      ? [
          {
            id: "actions",
            header: texts.actions,
            cell: ({ row }: { row: { original: ClubUser } }) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={locale === "ar" ? "start" : "end"}>
                  <DropdownMenuLabel>{texts.actions}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleOpenEditUser(row.original)}>
                    <Edit className="h-4 w-4 me-2" />
                    {texts.editUser}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleOpenResetPassword(row.original)}>
                    <KeyRound className="h-4 w-4 me-2" />
                    {texts.resetPassword}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          } satisfies ColumnDef<ClubUser>,
        ]
      : []),
  ];

  // Subscription columns
  const subscriptionColumns: ColumnDef<ClubSubscription>[] = [
    {
      accessorKey: "memberId",
      header: locale === "ar" ? "\u0627\u0644\u0639\u0636\u0648" : "Member",
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
          {row.original.daysRemaining} {locale === "ar" ? "\u064a\u0648\u0645" : "days"}
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
          <TabsTrigger value="subscriptions" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.subscriptions}</span>
          </TabsTrigger>
          <TabsTrigger value="plans-agreements" className="gap-2">
            <FileSignature className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.plansAndAgreements}</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.auditLogs}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab -- Stats + Locations */}
        <TabsContent value="overview" className="space-y-6">
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
                <CardTitle className="text-sm font-medium text-muted-foreground">{texts.totalSubscriptions}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clubDetail.stats.totalSubscriptions}</div>
                <p className="text-xs text-muted-foreground">
                  {clubDetail.stats.activeSubscriptions} {texts.activeSubscriptions.toLowerCase()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{texts.totalLocations}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clubDetail.stats.totalLocations ?? "\u2014"}</div>
              </CardContent>
            </Card>
          </div>

          {/* Locations grid below stats */}
          <ClubLocationsTab clubId={clubId} locale={locale} />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{texts.users}</CardTitle>
                {isPlatformAdmin && (
                  <Button size="sm" onClick={() => setAddUserDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 me-1" />
                    {texts.addUser}
                  </Button>
                )}
              </div>
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

        {/* Plans & Agreements Tab */}
        <TabsContent value="plans-agreements" className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              {texts.membershipPlans}
            </h3>
            <ClubMembershipPlansTab clubId={clubId} locale={locale} />
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-primary" />
              {texts.agreements}
            </h3>
            <ClubAgreementsTab clubId={clubId} locale={locale} />
          </div>
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

      {/* Edit Club Dialog */}
      <ClubEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        club={clubDetail}
        locale={locale}
        onSubmit={handleUpdateClub}
        isLoading={updateClubMutation.isPending}
      />

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{texts.addUserTitle}</DialogTitle>
            <DialogDescription>{texts.addUserDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={addUserForm.handleSubmit(handleAddUser)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{texts.email}</Label>
              <Input
                id="email"
                type="email"
                {...addUserForm.register("email")}
              />
              {addUserForm.formState.errors.email && (
                <p className="text-sm text-destructive">{addUserForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayNameEn">{texts.displayNameEn}</Label>
              <Input
                id="displayNameEn"
                {...addUserForm.register("displayNameEn")}
              />
              {addUserForm.formState.errors.displayNameEn && (
                <p className="text-sm text-destructive">{addUserForm.formState.errors.displayNameEn.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayNameAr">{texts.displayNameAr}</Label>
              <Input
                id="displayNameAr"
                dir="rtl"
                {...addUserForm.register("displayNameAr")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{texts.role}</Label>
              <Select
                value={addUserForm.watch("role")}
                onValueChange={(v) => addUserForm.setValue("role", v as AddUserFormValues["role"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectRole} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="CLUB_ADMIN">Club Admin</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="TRAINER">Trainer</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{texts.password}</Label>
              <Input
                id="password"
                type="password"
                {...addUserForm.register("password")}
              />
              {addUserForm.formState.errors.password && (
                <p className="text-sm text-destructive">{addUserForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{texts.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...addUserForm.register("confirmPassword")}
              />
              {addUserForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{addUserForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddUserDialogOpen(false);
                  addUserForm.reset();
                }}
              >
                {texts.cancel}
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 me-1 animate-spin" />
                    {texts.creating}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 me-1" />
                    {texts.addUser}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{texts.editUserTitle}</DialogTitle>
            <DialogDescription>{texts.editUserDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={editUserForm.handleSubmit(handleEditUser)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editDisplayNameEn">{texts.displayNameEn}</Label>
              <Input
                id="editDisplayNameEn"
                {...editUserForm.register("displayNameEn")}
              />
              {editUserForm.formState.errors.displayNameEn && (
                <p className="text-sm text-destructive">{editUserForm.formState.errors.displayNameEn.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDisplayNameAr">{texts.displayNameAr}</Label>
              <Input
                id="editDisplayNameAr"
                dir="rtl"
                {...editUserForm.register("displayNameAr")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editRole">{texts.role}</Label>
              <Select
                value={editUserForm.watch("role")}
                onValueChange={(v) => editUserForm.setValue("role", v as EditUserFormValues["role"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectRole} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="CLUB_ADMIN">Club Admin</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="TRAINER">Trainer</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editStatus">{texts.status}</Label>
              <Select
                value={editUserForm.watch("status")}
                onValueChange={(v) => editUserForm.setValue("status", v as EditUserFormValues["status"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{texts.active}</SelectItem>
                  <SelectItem value="INACTIVE">{texts.inactive}</SelectItem>
                  <SelectItem value="LOCKED">{texts.locked}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditUserDialogOpen(false);
                  setEditingUser(null);
                }}
              >
                {texts.cancel}
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 me-1 animate-spin" />
                    {texts.saving}
                  </>
                ) : (
                  texts.save
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{texts.resetPasswordTitle}</DialogTitle>
            <DialogDescription>
              {texts.resetPasswordDescription}
              {resetPasswordUser && (
                <span className="block mt-1 font-medium text-foreground">
                  {locale === "ar"
                    ? resetPasswordUser.displayName.ar || resetPasswordUser.displayName.en
                    : resetPasswordUser.displayName.en}{" "}
                  ({resetPasswordUser.email})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetNewPassword">{texts.newPassword}</Label>
              <Input
                id="resetNewPassword"
                type="password"
                {...resetPasswordForm.register("newPassword")}
              />
              {resetPasswordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive">{resetPasswordForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="resetConfirmPassword">{texts.confirmPassword}</Label>
              <Input
                id="resetConfirmPassword"
                type="password"
                {...resetPasswordForm.register("confirmPassword")}
              />
              {resetPasswordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{resetPasswordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setResetPasswordDialogOpen(false);
                  setResetPasswordUser(null);
                }}
              >
                {texts.cancel}
              </Button>
              <Button type="submit" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 me-1 animate-spin" />
                    {texts.resetting}
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 me-1" />
                    {texts.resetPassword}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
