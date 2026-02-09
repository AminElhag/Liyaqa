import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Send, Lock, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAddTicketMessage } from "@/hooks/use-support-tickets";
import { useToast } from "@/stores/toast-store";
import type { TicketMessage } from "@/types";

interface TicketMessagesProps {
  ticketId: string;
  messages: TicketMessage[];
  isLoading?: boolean;
  canReply?: boolean;
}

const messageSchema = z.object({
  content: z.string().min(1, "Message is required"),
  isInternal: z.boolean().default(false),
});

type MessageFormValues = {
  content: string;
  isInternal: boolean;
};

/**
 * Ticket message thread component with reply functionality.
 */
export function TicketMessages({
  ticketId,
  messages,
  isLoading = false,
  canReply = true,
}: TicketMessagesProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const toast = useToast();
  const addMessage = useAddTicketMessage();

  const texts = {
    reply: locale === "ar" ? "\u0627\u0644\u0631\u062F" : "Reply",
    internalNote: locale === "ar" ? "\u0645\u0644\u0627\u062D\u0638\u0629 \u062F\u0627\u062E\u0644\u064A\u0629" : "Internal Note",
    internalNoteDesc:
      locale === "ar"
        ? "\u0645\u0631\u0626\u064A\u0629 \u0641\u0642\u0637 \u0644\u0641\u0631\u064A\u0642 \u0627\u0644\u0645\u0646\u0635\u0629"
        : "Only visible to platform team",
    send: locale === "ar" ? "\u0625\u0631\u0633\u0627\u0644" : "Send",
    sending: locale === "ar" ? "\u062C\u0627\u0631\u064A \u0627\u0644\u0625\u0631\u0633\u0627\u0644..." : "Sending...",
    noMessages: locale === "ar" ? "\u0644\u0627 \u062A\u0648\u062C\u062F \u0631\u0633\u0627\u0626\u0644 \u0628\u0639\u062F" : "No messages yet",
    internal: locale === "ar" ? "\u062F\u0627\u062E\u0644\u064A" : "Internal",
    platformTeam: locale === "ar" ? "\u0641\u0631\u064A\u0642 \u0627\u0644\u0645\u0646\u0635\u0629" : "Platform Team",
    client: locale === "ar" ? "\u0627\u0644\u0639\u0645\u064A\u0644" : "Client",
    messagePlaceholder:
      locale === "ar" ? "\u0627\u0643\u062A\u0628 \u0631\u062F\u0643 \u0647\u0646\u0627..." : "Type your reply here...",
    successDesc: locale === "ar" ? "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0633\u0627\u0644\u0629" : "Message sent successfully",
    loading: locale === "ar" ? "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644..." : "Loading...",
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MessageFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(messageSchema) as any,
    defaultValues: {
      content: "",
      isInternal: false,
    },
  });

  const watchIsInternal = watch("isInternal");

  const onSubmit = (data: MessageFormValues) => {
    addMessage.mutate(
      { ticketId, data },
      {
        onSuccess: () => {
          reset();
          toast.success(texts.successDesc);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(
      locale === "ar" ? "ar-SA" : "en-SA",
      {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        {texts.loading}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Messages List */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto p-2">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {texts.noMessages}
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "p-4 rounded-lg",
                message.isInternal
                  ? "bg-amber-50 border border-amber-200"
                  : message.isFromClient
                  ? "bg-slate-50 border border-slate-200"
                  : "bg-blue-50 border border-blue-200"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {message.isFromClient ? (
                    <Building2 className="h-4 w-4 text-slate-600" />
                  ) : (
                    <User className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="font-medium">{message.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {message.isFromClient ? texts.client : texts.platformTeam}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {message.isInternal && (
                    <span className="flex items-center gap-1 text-xs text-amber-700">
                      <Lock className="h-3 w-3" />
                      {texts.internal}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              </div>
              {/* Content */}
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Reply Form */}
      {canReply && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">{texts.reply}</Label>
                <Textarea
                  id="content"
                  placeholder={texts.messagePlaceholder}
                  rows={3}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  {...register("content")}
                />
                {errors.content && (
                  <p className="text-sm text-destructive">
                    {errors.content.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    id="isInternal"
                    checked={watchIsInternal}
                    onCheckedChange={(checked) => setValue("isInternal", checked)}
                  />
                  <div>
                    <Label htmlFor="isInternal" className="cursor-pointer">
                      {texts.internalNote}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {texts.internalNoteDesc}
                    </p>
                  </div>
                </div>

                <Button type="submit" disabled={addMessage.isPending}>
                  <Send className="me-2 h-4 w-4" />
                  {addMessage.isPending ? texts.sending : texts.send}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
