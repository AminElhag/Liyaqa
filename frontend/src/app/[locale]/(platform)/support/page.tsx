"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Plus,
  Ticket,
  CircleDot,
  Clock,
  UserX,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Loading } from "@/components/ui/spinner";
import { getTicketColumns } from "@/components/platform/ticket-columns";
import { AssignTicketDialog } from "@/components/platform/assign-ticket-dialog";
import { ChangeStatusDialog } from "@/components/platform/change-status-dialog";
import { useAuthStore } from "@/stores/auth-store";
import { useImpersonationStore } from "@/stores/impersonation-store";
import { useToast } from "@/hooks/use-toast";
import { impersonateUser } from "@/lib/api/platform/support";
import {
  useSupportTickets,
  useTicketStats,
} from "@/queries/platform/use-support-tickets";
import type {
  SupportTicketSummary,
  TicketStatus,
  TicketPriority,
} from "@/types/platform/support-ticket";

type StatusFilter = "ALL" | TicketStatus;
type PriorityFilter = "ALL" | TicketPriority;

export default function SupportTicketsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();

  // Impersonation
  const { startImpersonation } = useImpersonationStore();

  // State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Dialog state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketSummary | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Permissions
  const canEdit = user?.role === "PLATFORM_ADMIN";
  const canImpersonate = user?.role === "PLATFORM_ADMIN";

  // Query params
  const queryParams = {
    page,
    size: pageSize,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    priority: priorityFilter === "ALL" ? undefined : priorityFilter,
    search: search || undefined,
    sortBy: "createdAt",
    sortDirection: "desc" as const,
  };

  // Data fetching
  const { data, isLoading, error } = useSupportTickets(queryParams);
  const { data: stats } = useTicketStats();

  // Bilingual texts
  const texts = {
    title: locale === "ar" ? "تذاكر الدعم" : "Support Tickets",
    description:
      locale === "ar"
        ? "إدارة تذاكر دعم العملاء"
        : "Manage client support tickets",
    newTicket: locale === "ar" ? "تذكرة جديدة" : "New Ticket",
    total: locale === "ar" ? "الإجمالي" : "Total",
    open: locale === "ar" ? "مفتوحة" : "Open",
    inProgress: locale === "ar" ? "قيد التنفيذ" : "In Progress",
    waitingOnClient: locale === "ar" ? "بانتظار العميل" : "Waiting on Client",
    resolved: locale === "ar" ? "تم الحل" : "Resolved",
    closed: locale === "ar" ? "مغلقة" : "Closed",
    filterStatus: locale === "ar" ? "تصفية بالحالة" : "Filter by Status",
    filterPriority: locale === "ar" ? "تصفية بالأولوية" : "Filter by Priority",
    all: locale === "ar" ? "الكل" : "All",
    searchPlaceholder:
      locale === "ar" ? "بحث عن التذاكر..." : "Search tickets...",
    noTickets: locale === "ar" ? "لا توجد تذاكر" : "No tickets found",
    loadingError:
      locale === "ar" ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    impersonateConfirm:
      locale === "ar"
        ? "هل أنت متأكد من انتحال شخصية هذا العميل؟"
        : "Are you sure you want to impersonate this client?",
    impersonateReason:
      locale === "ar"
        ? "سبب الانتحال (مطلوب للتدقيق)"
        : "Reason for impersonation (required for audit)",
    impersonateSuccess:
      locale === "ar"
        ? "تم بدء جلسة الانتحال بنجاح"
        : "Impersonation session started successfully",
    impersonating:
      locale === "ar" ? "جاري بدء الانتحال..." : "Starting impersonation...",
    low: locale === "ar" ? "منخفضة" : "Low",
    medium: locale === "ar" ? "متوسطة" : "Medium",
    high: locale === "ar" ? "عالية" : "High",
    urgent: locale === "ar" ? "عاجلة" : "Urgent",
  };

  // Handlers
  const handleView = (ticket: SupportTicketSummary) => {
    router.push(`/${locale}/support/${ticket.id}`);
  };

  const handleEdit = (ticket: SupportTicketSummary) => {
    router.push(`/${locale}/support/${ticket.id}/edit`);
  };

  const handleAssign = (ticket: SupportTicketSummary) => {
    setSelectedTicket(ticket);
    setAssignDialogOpen(true);
  };

  const handleChangeStatus = (ticket: SupportTicketSummary) => {
    setSelectedTicket(ticket);
    setStatusDialogOpen(true);
  };

  const handleImpersonate = async (ticket: SupportTicketSummary) => {
    // Prompt for reason
    const reason = window.prompt(texts.impersonateReason);
    if (!reason?.trim()) {
      return; // User cancelled or didn't provide reason
    }

    setIsImpersonating(true);
    try {
      // Get user ID from the ticket's organization admin
      // Note: The ticket has organizationId, we'd need to get a user ID to impersonate
      // For now, we'll show a message that this needs the organization admin's user ID
      toast({
        title: texts.errorTitle,
        description:
          locale === "ar"
            ? "يرجى استخدام صفحة تفاصيل التذكرة للانتحال"
            : "Please use the ticket detail page for impersonation",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: texts.errorTitle,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsImpersonating(false);
    }
  };

  // Columns
  const columns = useMemo(
    () =>
      getTicketColumns({
        locale,
        onView: handleView,
        onEdit: handleEdit,
        onAssign: handleAssign,
        onChangeStatus: handleChangeStatus,
        onImpersonate: handleImpersonate,
        canEdit,
        canImpersonate,
      }),
    [locale, canEdit, canImpersonate]
  );

  // Data
  const tickets = data?.content || [];
  const totalElements = data?.totalElements || 0;

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {texts.loadingError}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href={`/${locale}/support/new`}>
              <Plus className="me-2 h-4 w-4" />
              {texts.newTicket}
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.total}</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.open}</CardTitle>
            <CircleDot className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.open || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.inProgress}</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.inProgress || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.waitingOnClient}</CardTitle>
            <UserX className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.waitingOnClient || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.resolved}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.resolved || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.closed}</CardTitle>
            <XCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-500">
              {stats?.closed || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="w-full sm:w-64">
              <Input
                placeholder={texts.searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as StatusFilter);
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.filterStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{texts.all}</SelectItem>
                  <SelectItem value="OPEN">{texts.open}</SelectItem>
                  <SelectItem value="IN_PROGRESS">{texts.inProgress}</SelectItem>
                  <SelectItem value="WAITING_ON_CLIENT">
                    {texts.waitingOnClient}
                  </SelectItem>
                  <SelectItem value="RESOLVED">{texts.resolved}</SelectItem>
                  <SelectItem value="CLOSED">{texts.closed}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="w-full sm:w-48">
              <Select
                value={priorityFilter}
                onValueChange={(value) => {
                  setPriorityFilter(value as PriorityFilter);
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.filterPriority} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{texts.all}</SelectItem>
                  <SelectItem value="LOW">{texts.low}</SelectItem>
                  <SelectItem value="MEDIUM">{texts.medium}</SelectItem>
                  <SelectItem value="HIGH">{texts.high}</SelectItem>
                  <SelectItem value="URGENT">{texts.urgent}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loading />
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              {texts.noTickets}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={tickets}
              manualPagination
              pageCount={data?.totalPages || 1}
              pageIndex={page}
              pageSize={pageSize}
              totalRows={totalElements}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AssignTicketDialog
        ticket={selectedTicket}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
      />

      <ChangeStatusDialog
        ticket={selectedTicket}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
      />
    </div>
  );
}
