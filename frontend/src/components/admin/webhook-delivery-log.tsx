"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { formatDistanceToNow, format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { RefreshCw, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useWebhookDeliveries,
  useRetryWebhookDelivery,
} from "@/queries/use-webhooks";
import type { WebhookDelivery, DeliveryStatus } from "@/types/webhook";
import { DELIVERY_STATUS_LABELS } from "@/types/webhook";

interface WebhookDeliveryLogProps {
  webhookId: string;
}

function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const config = DELIVERY_STATUS_LABELS[status];

  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    green: "default",
    yellow: "outline",
    blue: "secondary",
    red: "destructive",
    gray: "secondary",
  };

  return (
    <Badge variant={variants[config.color] || "secondary"}>
      {isArabic ? config.ar : config.en}
    </Badge>
  );
}

function DeliveryRow({
  delivery,
  webhookId,
  isArabic,
  dateLocale,
}: {
  delivery: WebhookDelivery;
  webhookId: string;
  isArabic: boolean;
  dateLocale: typeof ar | typeof enUS;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const retryMutation = useRetryWebhookDelivery();

  const canRetry =
    delivery.status === "FAILED" || delivery.status === "EXHAUSTED";

  const handleRetry = () => {
    retryMutation.mutate({ webhookId, deliveryId: delivery.id });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <TableRow className="hover:bg-muted/50">
        <TableCell>
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {delivery.eventType}
          </code>
        </TableCell>
        <TableCell>
          <DeliveryStatusBadge status={delivery.status} />
        </TableCell>
        <TableCell className="text-center">{delivery.attemptCount}</TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {formatDistanceToNow(new Date(delivery.createdAt), {
            addSuffix: true,
            locale: dateLocale,
          })}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {canRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                disabled={retryMutation.isPending}
              >
                {retryMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </TableCell>
      </TableRow>
      <CollapsibleContent asChild>
        <TableRow>
          <TableCell colSpan={5} className="bg-muted/30">
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">
                    {isArabic ? "معرف الحدث:" : "Event ID:"}
                  </span>
                  <code className="ms-2 text-xs bg-muted px-2 py-1 rounded">
                    {delivery.eventId}
                  </code>
                </div>
                {delivery.deliveredAt && (
                  <div>
                    <span className="font-medium">
                      {isArabic ? "وقت التسليم:" : "Delivered at:"}
                    </span>
                    <span className="ms-2">
                      {format(new Date(delivery.deliveredAt), "PPpp", {
                        locale: dateLocale,
                      })}
                    </span>
                  </div>
                )}
                {delivery.lastResponseCode && (
                  <div>
                    <span className="font-medium">
                      {isArabic ? "كود الاستجابة:" : "Response code:"}
                    </span>
                    <span className="ms-2">{delivery.lastResponseCode}</span>
                  </div>
                )}
                {delivery.nextRetryAt && (
                  <div>
                    <span className="font-medium">
                      {isArabic ? "إعادة المحاولة التالية:" : "Next retry:"}
                    </span>
                    <span className="ms-2">
                      {formatDistanceToNow(new Date(delivery.nextRetryAt), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </span>
                  </div>
                )}
              </div>
              {delivery.lastError && (
                <div>
                  <span className="font-medium text-sm text-destructive">
                    {isArabic ? "خطأ:" : "Error:"}
                  </span>
                  <pre className="mt-1 text-xs bg-destructive/10 text-destructive p-2 rounded overflow-x-auto">
                    {delivery.lastError}
                  </pre>
                </div>
              )}
              {delivery.lastResponseBody && (
                <div>
                  <span className="font-medium text-sm">
                    {isArabic ? "الاستجابة:" : "Response:"}
                  </span>
                  <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                    {delivery.lastResponseBody}
                  </pre>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function WebhookDeliveryLog({ webhookId }: WebhookDeliveryLogProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useWebhookDeliveries(webhookId, {
    page,
    size: 10,
  });

  const texts = {
    title: isArabic ? "سجل التسليم" : "Delivery Log",
    eventType: isArabic ? "نوع الحدث" : "Event Type",
    status: isArabic ? "الحالة" : "Status",
    attempts: isArabic ? "المحاولات" : "Attempts",
    created: isArabic ? "التاريخ" : "Date",
    actions: isArabic ? "الإجراءات" : "Actions",
    noDeliveries: isArabic ? "لا توجد عمليات تسليم بعد" : "No deliveries yet",
    loading: isArabic ? "جارٍ التحميل..." : "Loading...",
    error: isArabic ? "حدث خطأ" : "Error occurred",
    previous: isArabic ? "السابق" : "Previous",
    next: isArabic ? "التالي" : "Next",
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{texts.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ms-2 text-muted-foreground">{texts.loading}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{texts.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{texts.error}</p>
        </CardContent>
      </Card>
    );
  }

  const deliveries = data?.content || [];
  const totalPages = data?.totalPages || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{texts.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {deliveries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {texts.noDeliveries}
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{texts.eventType}</TableHead>
                  <TableHead>{texts.status}</TableHead>
                  <TableHead className="text-center">{texts.attempts}</TableHead>
                  <TableHead>{texts.created}</TableHead>
                  <TableHead>{texts.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <DeliveryRow
                    key={delivery.id}
                    delivery={delivery}
                    webhookId={webhookId}
                    isArabic={isArabic}
                    dateLocale={dateLocale}
                  />
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  {texts.previous}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                >
                  {texts.next}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
