import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Link } from "react-router-dom";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/feedback";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupportTickets } from "@/hooks/use-support-tickets";
import { TicketStatusBadge } from "./ticket-status-badge";
import { TicketPriorityBadge } from "./ticket-priority-badge";
import { formatDate } from "@/lib/utils";
import type { TicketStatus } from "@/types";

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
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");

  const { data, isLoading, error } = useSupportTickets({
    organizationId,
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    size: 10,
  });

  const texts = {
    title: locale === "ar" ? "\u062A\u0630\u0627\u0643\u0631 \u0627\u0644\u062F\u0639\u0645" : "Support Tickets",
    createTicket: locale === "ar" ? "\u062A\u0630\u0643\u0631\u0629 \u062C\u062F\u064A\u062F\u0629" : "New Ticket",
    filterByStatus: locale === "ar" ? "\u062A\u0635\u0641\u064A\u0629 \u062D\u0633\u0628 \u0627\u0644\u062D\u0627\u0644\u0629" : "Filter by status",
    allStatuses: locale === "ar" ? "\u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0627\u0644\u0627\u062A" : "All Statuses",
    open: locale === "ar" ? "\u0645\u0641\u062A\u0648\u062D\u0629" : "Open",
    inProgress: locale === "ar" ? "\u0642\u064A\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630" : "In Progress",
    waitingOnClient: locale === "ar" ? "\u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u0639\u0645\u064A\u0644" : "Waiting on Client",
    resolved: locale === "ar" ? "\u062A\u0645 \u0627\u0644\u062D\u0644" : "Resolved",
    closed: locale === "ar" ? "\u0645\u063A\u0644\u0642\u0629" : "Closed",
    noTickets: locale === "ar" ? "\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u0630\u0627\u0643\u0631 \u062F\u0639\u0645" : "No support tickets found",
    errorLoading: locale === "ar" ? "\u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u062A\u0630\u0627\u0643\u0631" : "Error loading tickets",
    viewDetails: locale === "ar" ? "\u0639\u0631\u0636 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644" : "View Details",
    loadMore: locale === "ar" ? "\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0632\u064A\u062F" : "Load More",
    previous: locale === "ar" ? "\u0627\u0644\u0633\u0627\u0628\u0642" : "Previous",
    showing: locale === "ar" ? "\u0639\u0631\u0636" : "Showing",
    of: locale === "ar" ? "\u0645\u0646" : "of",
    results: locale === "ar" ? "\u0646\u062A\u064A\u062C\u0629" : "results",
    statsOpen: locale === "ar" ? "\u0645\u0641\u062A\u0648\u062D\u0629" : "Open",
    statsInProgress: locale === "ar" ? "\u0642\u064A\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630" : "In Progress",
    statsResolved: locale === "ar" ? "\u062A\u0645 \u0627\u0644\u062D\u0644" : "Resolved",
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
          <LoadingSkeleton variant="table" />
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
              <Link to={`/support/new?organizationId=${organizationId}`}>
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
                          &rarr; {ticket.assignedToName}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/support/${ticket.id}`}>
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
