"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketForm, type TicketFormValues } from "@/components/platform/ticket-form";
import { useCreateTicket } from "@/queries/platform/use-support-tickets";
import { useToast } from "@/hooks/use-toast";
import type { CreateTicketRequest } from "@/types/platform/support-ticket";

export default function NewSupportTicketPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const createTicket = useCreateTicket();

  const texts = {
    title: locale === "ar" ? "إنشاء تذكرة دعم" : "Create Support Ticket",
    description:
      locale === "ar"
        ? "إنشاء تذكرة دعم جديدة لأحد العملاء"
        : "Create a new support ticket for a client",
    successTitle: locale === "ar" ? "تم الإنشاء" : "Created",
    successDesc:
      locale === "ar"
        ? "تم إنشاء تذكرة الدعم بنجاح"
        : "Support ticket created successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
  };

  const handleSubmit = (data: TicketFormValues) => {
    // Convert form values to API request
    const request: CreateTicketRequest = {
      organizationId: data.organizationId,
      clubId: data.clubId || undefined,
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority,
      assignedToId: data.assignedToId || undefined,
      isInternal: data.isInternal,
      tags: data.tags
        ? data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
    };

    createTicket.mutate(request, {
      onSuccess: (result) => {
        toast({
          title: texts.successTitle,
          description: texts.successDesc,
        });
        router.push(`/${locale}/support/${result.id}`);
      },
      onError: (error) => {
        toast({
          title: texts.errorTitle,
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/support`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
      </div>

      {/* Form */}
      <TicketForm
        onSubmit={handleSubmit}
        isLoading={createTicket.isPending}
        mode="create"
      />
    </div>
  );
}
