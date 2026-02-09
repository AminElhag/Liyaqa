"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import Link from "next/link";
import {
  Ticket,
  Plus,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { useSupportTickets } from "@liyaqa/shared/queries/platform/use-support-tickets";
import { TicketStatusBadge } from "./ticket-status-badge";
import { TicketPriorityBadge } from "./ticket-priority-badge";
import { formatDate } from "@liyaqa/shared/utils";
import type { TicketStatus } from "@liyaqa/shared/types/platform/support-ticket";

interface ClientSupportTabProps {
  organizationId: string;
}

const statusIcons: Record<TicketStatus, React.ReactNode> = {
  OPEN: <AlertCircle className="h-4 w-4" />,
  IN_PROGRESS: <Clock className="h-4 w-4" />,
  WAITING_ON_CLIENT: <MessageSquare className="h-4 w-4" />,
  RESOLVED: <CheckCircle className="h-4 w-4" />,
  CLOSED: <XCircle className="h-4 w-4" />,
};

export function ClientSupportTab({ organizationId }: ClientSupportTabProps) {
  const locale = useLocale();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");

  const { data, isLoading, error } = useSupportTickets({
    organizationId,
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    size: 10,
  });

  const texts = {
    title: locale === "ar" ? "تذاكر الدعم" : "Support Tickets",
    createTicket: locale === "ar" ? "تذكرة جديدة" : "New Ticket",
    filterByStatus: locale === "ar" ? "تصفية حسب الحالة" : "Filter by status",
    allStatuses: locale === "ar" ? "جميع الحالات" : "All Statuses",
    open: locale === "ar" ? "مفتوحة" : "Open",
    inProgress: locale === "ar" ? "قيد التنفيذ" : "In Progress",
    waitingOnClient: locale === "ar" ? "بانتظار العميل" : "Waiting on Client",
    resolved: locale === "ar" ? "تم الحل" : "Resolved",
    closed: locale === "ar" ? "مغلقة" : "Closed",
    noTickets: locale === "ar" ? "لا توجد تذاكر دعم" : "No support tickets found",
    errorLoading: locale === "ar" ? "خطأ في تحميل التذاكر" : "Error loading tickets",
    viewDetails: locale === "ar" ? "عرض التفاصيل" : "View Details",
    loadMore: locale === "ar" ? "تحميل المزيد" : "Load More",
    previous: locale === "ar" ? "السابق" : "Previous",
    showing: locale === "ar" ? "عرض" : "Showing",
    of: locale === "ar" ? "من" : "of",
    results: locale === "ar" ? "نتيجة" : "results",
    statsOpen: locale === "ar" ? "مفتوحة" : "Open",
    statsInProgress: locale === "ar" ? "قيد التنفيذ" : "In Progress",
    statsResolved: locale === "ar" ? "تم الحل" : "Resolved",
  };

  const statusLabels: Record<TicketStatus, string> = {
    OPEN: texts.open,
    IN_PROGRESS: texts.inProgress,
    WAITING_ON_CLIENT: texts.waitingOnClient,
    RESOLVED: texts.resolved,
    CLOSED: texts.closed,
  };

  if (isLoading && page === 0) {
    return (
      <Card className="border-rose-500/20">
        <CardContent className="py-10 flex justify-center">
          <Loading />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-rose-500/20">
        <CardContent className="py-6 text-center text-destructive">
          {texts.errorLoading}
        </CardContent>
      </Card>
    );
  }

  const tickets = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 0;

  // Calculate quick stats from loaded data
  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;

  return (
    <Card className="border-rose-500/20">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-rose-600" />
            {texts.title}
          </CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Stats */}
            <div className="flex items-center gap-2 me-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {openCount} {texts.statsOpen}
              </Badge>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {inProgressCount} {texts.statsInProgress}
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {resolvedCount} {texts.statsResolved}
              </Badge>
            </div>

            {/* Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as TicketStatus | "all");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={texts.filterByStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{texts.allStatuses}</SelectItem>
                {(Object.keys(statusLabels) as TicketStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Create Button */}
            <Button size="sm" asChild>
              <Link href={`/${locale}/support/new?organizationId=${organizationId}`}>
                <Plus className="me-2 h-4 w-4" />
                {texts.createTicket}
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            {texts.noTickets}
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    {statusIcons[ticket.status]}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {ticket.ticketNumber}
                      </span>
                      <TicketStatusBadge status={ticket.status} />
                      <TicketPriorityBadge priority={ticket.priority} />
                    </div>
                    <p className="font-medium line-clamp-1">{ticket.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(ticket.createdAt, locale)}
                      {ticket.assignedToName && (
                        <span className="ms-2">
                          → {ticket.assignedToName}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/${locale}/support/${ticket.id}`}>
                    <ExternalLink className="me-2 h-4 w-4" />
                    {texts.viewDetails}
                  </Link>
                </Button>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {texts.showing} {page * 10 + 1}-{Math.min((page + 1) * 10, totalElements)} {texts.of} {totalElements} {texts.results}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    {texts.previous}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    {texts.loadMore}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
