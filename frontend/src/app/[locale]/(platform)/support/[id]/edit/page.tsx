"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/spinner";
import { TicketForm, type TicketFormValues } from "@/components/platform/ticket-form";
import {
  useSupportTicket,
  useUpdateTicket,
} from "@/queries/platform/use-support-tickets";
import { useToast } from "@/hooks/use-toast";
import type { UpdateTicketRequest } from "@/types/platform/support-ticket";

export default function EditSupportTicketPage() {
  const params = useParams();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const ticketId = params.id as string;

  // Data fetching
  const { data: ticket, isLoading, error } = useSupportTicket(ticketId);
  const updateTicket = useUpdateTicket();

  const texts = {
    title: locale === "ar" ? "تعديل تذكرة الدعم" : "Edit Support Ticket",
    description:
      locale === "ar"
        ? "تحديث معلومات تذكرة الدعم"
        : "Update support ticket information",
    successTitle: locale === "ar" ? "تم التحديث" : "Updated",
    successDesc:
      locale === "ar"
        ? "تم تحديث تذكرة الدعم بنجاح"
        : "Support ticket updated successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    loadingError:
      locale === "ar" ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    notFound: locale === "ar" ? "التذكرة غير موجودة" : "Ticket not found",
  };

  const handleSubmit = (data: TicketFormValues) => {
    // Convert form values to API request
    const request: UpdateTicketRequest = {
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority,
      assignedToId: data.assignedToId || undefined,
      tags: data.tags
        ? data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
    };

    updateTicket.mutate(
      { id: ticketId, data: request },
      {
        onSuccess: () => {
          toast({
            title: texts.successTitle,
            description: texts.successDesc,
          });
          router.push(`/${locale}/support/${ticketId}`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/support/${ticketId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {texts.title} - {ticket.ticketNumber}
          </h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
      </div>

      {/* Form */}
      <TicketForm
        ticket={ticket}
        onSubmit={handleSubmit}
        isLoading={updateTicket.isPending}
        mode="edit"
      />
    </div>
  );
}
