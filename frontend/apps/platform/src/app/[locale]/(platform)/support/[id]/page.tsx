"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  Ticket,
  Building2,
  Calendar,
  UserCheck,
  Edit,
  Clock,
  Tag,
  MessageSquare,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { TicketStatusBadge } from "@liyaqa/shared/components/platform/ticket-status-badge";
import { TicketPriorityBadge } from "@liyaqa/shared/components/platform/ticket-priority-badge";
import { TicketMessages } from "@liyaqa/shared/components/platform/ticket-messages";
import { AssignTicketDialog } from "@liyaqa/shared/components/platform/assign-ticket-dialog";
import { ChangeStatusDialog } from "@liyaqa/shared/components/platform/change-status-dialog";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useSupportTicket,
  useTicketMessages,
} from "@liyaqa/shared/queries/platform/use-support-tickets";
import type { LocalizedText } from "@liyaqa/shared/types/api";
import type { TicketCategory, SupportTicketSummary } from "@liyaqa/shared/types/platform/support-ticket";

/**
 * Get localized text based on locale.
 */
function getLocalizedText(
  text: LocalizedText | undefined,
  locale: string
): string {
  if (!text) return "-";
  return locale === "ar" ? text.ar || text.en : text.en;
}

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
 * Category labels for display.
 */
const CATEGORY_LABELS: Record<TicketCategory, { en: string; ar: string }> = {
  BILLING: { en: "Billing", ar: "الفوترة" },
  TECHNICAL: { en: "Technical", ar: "تقني" },
  ACCOUNT: { en: "Account", ar: "الحساب" },
  FEATURE_REQUEST: { en: "Feature Request", ar: "طلب ميزة" },
  BUG_REPORT: { en: "Bug Report", ar: "تقرير خطأ" },
  GENERAL: { en: "General", ar: "عام" },
};

export default function SupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const ticketId = params.id as string;

  // Permissions
  const canEdit = user?.role === "PLATFORM_ADMIN";
  const isClosed = false; // Will be determined from data

  // Dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [changeStatusDialogOpen, setChangeStatusDialogOpen] = useState(false);

  // Data fetching
  const { data: ticket, isLoading, error } = useSupportTicket(ticketId);
  const { data: messages = [], isLoading: messagesLoading } =
    useTicketMessages(ticketId);

  // Bilingual texts
  const texts = {
    back: locale === "ar" ? "العودة" : "Back",
    edit: locale === "ar" ? "تعديل" : "Edit",
    assign: locale === "ar" ? "إسناد" : "Assign",
    changeStatus: locale === "ar" ? "تغيير الحالة" : "Change Status",
    ticketDetails: locale === "ar" ? "تفاصيل التذكرة" : "Ticket Details",
    ticketDetailsDesc:
      locale === "ar" ? "معلومات التذكرة الأساسية" : "Basic ticket information",
    clientInfo: locale === "ar" ? "معلومات العميل" : "Client Information",
    clientInfoDesc:
      locale === "ar"
        ? "معلومات المؤسسة المرتبطة"
        : "Related organization information",
    assignment: locale === "ar" ? "الإسناد" : "Assignment",
    assignmentDesc:
      locale === "ar" ? "معلومات الإسناد والتتبع" : "Assignment and tracking info",
    conversation: locale === "ar" ? "المحادثة" : "Conversation",
    conversationDesc:
      locale === "ar"
        ? "سجل الرسائل والردود"
        : "Message history and replies",
    timestamps: locale === "ar" ? "التواريخ" : "Timestamps",
    subject: locale === "ar" ? "الموضوع" : "Subject",
    description: locale === "ar" ? "الوصف" : "Description",
    category: locale === "ar" ? "التصنيف" : "Category",
    priority: locale === "ar" ? "الأولوية" : "Priority",
    status: locale === "ar" ? "الحالة" : "Status",
    organization: locale === "ar" ? "المؤسسة" : "Organization",
    club: locale === "ar" ? "النادي" : "Club",
    createdBy: locale === "ar" ? "أنشئ بواسطة" : "Created By",
    assignedTo: locale === "ar" ? "مسند إلى" : "Assigned To",
    unassigned: locale === "ar" ? "غير مسند" : "Unassigned",
    tags: locale === "ar" ? "العلامات" : "Tags",
    noTags: locale === "ar" ? "لا توجد علامات" : "No tags",
    internal: locale === "ar" ? "داخلي" : "Internal",
    createdAt: locale === "ar" ? "تاريخ الإنشاء" : "Created At",
    updatedAt: locale === "ar" ? "آخر تحديث" : "Last Updated",
    resolvedAt: locale === "ar" ? "تاريخ الحل" : "Resolved At",
    closedAt: locale === "ar" ? "تاريخ الإغلاق" : "Closed At",
    loadingError:
      locale === "ar" ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    notFound: locale === "ar" ? "التذكرة غير موجودة" : "Ticket not found",
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
  if (error || !ticket) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.loadingError : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  const ticketIsClosed = ticket.status === "CLOSED";
  const ticketIsResolved = ticket.status === "RESOLVED";
  const canReply = !ticketIsClosed;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/support`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Ticket className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">{ticket.ticketNumber}</h1>
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
              {ticket.isInternal && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                  {texts.internal}
                </span>
              )}
            </div>
            <p className="mt-1 text-muted-foreground">{ticket.subject}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {!ticketIsClosed && (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/${locale}/support/${ticketId}/edit`)}
                >
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </Button>
                {!ticketIsResolved && (
                  <Button
                    variant="outline"
                    onClick={() => setAssignDialogOpen(true)}
                  >
                    <UserCheck className="me-2 h-4 w-4" />
                    {texts.assign}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setChangeStatusDialogOpen(true)}
                >
                  <Clock className="me-2 h-4 w-4" />
                  {texts.changeStatus}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ticket Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <CardTitle>{texts.ticketDetails}</CardTitle>
            </div>
            <CardDescription>{texts.ticketDetailsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{texts.subject}</p>
              <p className="font-medium">{ticket.subject}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.description}</p>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{texts.category}</p>
                <p className="font-medium">
                  {locale === "ar"
                    ? CATEGORY_LABELS[ticket.category].ar
                    : CATEGORY_LABELS[ticket.category].en}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{texts.priority}</p>
                <TicketPriorityBadge priority={ticket.priority} />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{texts.tags}</p>
              {ticket.tags && ticket.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {ticket.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-slate-100 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">{texts.noTags}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>{texts.clientInfo}</CardTitle>
            </div>
            <CardDescription>{texts.clientInfoDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{texts.organization}</p>
              <p className="font-medium">
                {ticket.organizationName
                  ? getLocalizedText(ticket.organizationName, locale)
                  : `ID: ${ticket.organizationId}`}
              </p>
            </div>
            {ticket.clubId && (
              <div>
                <p className="text-sm text-muted-foreground">{texts.club}</p>
                <p className="font-medium">
                  {ticket.clubName
                    ? getLocalizedText(ticket.clubName, locale)
                    : `ID: ${ticket.clubId}`}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">{texts.createdBy}</p>
              <p className="font-medium">
                {ticket.createdByName || ticket.createdByEmail || "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <CardTitle>{texts.assignment}</CardTitle>
            </div>
            <CardDescription>{texts.assignmentDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{texts.status}</p>
                <TicketStatusBadge status={ticket.status} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{texts.assignedTo}</p>
                <p
                  className={
                    ticket.assignedToName
                      ? "font-medium"
                      : "text-muted-foreground italic"
                  }
                >
                  {ticket.assignedToName || texts.unassigned}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar" ? "عدد الرسائل" : "Messages"}
                </p>
                <p className="font-medium">{ticket.messageCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversation Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>{texts.conversation}</CardTitle>
            </div>
            <CardDescription>{texts.conversationDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <TicketMessages
              ticketId={ticketId}
              messages={messages}
              isLoading={messagesLoading}
              canReply={canReply}
            />
          </CardContent>
        </Card>

        {/* Timestamps Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>{texts.timestamps}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{texts.createdAt}</p>
                <p className="font-medium">{formatDate(ticket.createdAt, locale)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{texts.updatedAt}</p>
                <p className="font-medium">{formatDate(ticket.updatedAt, locale)}</p>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">{texts.resolvedAt}</p>
                  <p className="font-medium">
                    {formatDate(ticket.resolvedAt, locale)}
                  </p>
                </div>
              )}
              {ticket.closedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">{texts.closedAt}</p>
                  <p className="font-medium">
                    {formatDate(ticket.closedAt, locale)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AssignTicketDialog
        ticket={ticket as SupportTicketSummary}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
      />

      <ChangeStatusDialog
        ticket={ticket as SupportTicketSummary}
        open={changeStatusDialogOpen}
        onOpenChange={setChangeStatusDialogOpen}
      />
    </div>
  );
}
