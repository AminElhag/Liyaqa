"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import type { Webhook, CreateWebhookRequest } from "@/types/webhook";
import { EVENT_TYPE_CATEGORIES } from "@/types/webhook";

const webhookFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  url: z
    .string()
    .min(1, "URL is required")
    .max(2000)
    .refine(
      (url) => url.startsWith("https://") || url.startsWith("http://localhost"),
      "URL must use HTTPS (except for localhost)"
    ),
  events: z.array(z.string()).min(1, "Select at least one event"),
  rateLimitPerMinute: z.number().min(1).max(1000).default(60),
  isActive: z.boolean().default(true),
});

export type WebhookFormData = z.infer<typeof webhookFormSchema>;

interface WebhookFormProps {
  webhook?: Webhook;
  onSubmit: (data: WebhookFormData) => void;
  isPending?: boolean;
}

export function WebhookForm({ webhook, onSubmit, isPending }: WebhookFormProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      name: webhook?.name || "",
      url: webhook?.url || "",
      events: webhook?.events || [],
      rateLimitPerMinute: webhook?.rateLimitPerMinute || 60,
      isActive: webhook?.isActive ?? true,
    },
  });

  const selectedEvents = watch("events");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isArabic ? "المعلومات الأساسية" : "Basic Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {isArabic ? "الاسم" : "Name"}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder={isArabic ? "مثال: نظام CRM" : "e.g., CRM Integration"}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">
              {isArabic ? "رابط الويب هوك" : "Webhook URL"}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="url"
              {...register("url")}
              placeholder="https://example.com/webhooks/liyaqa"
              dir="ltr"
            />
            {errors.url && (
              <p className="text-sm text-destructive">{errors.url.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {isArabic
                ? "يجب أن يستخدم HTTPS (باستثناء localhost للتطوير)"
                : "Must use HTTPS (except localhost for development)"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rateLimitPerMinute">
                {isArabic ? "الحد الأقصى بالدقيقة" : "Rate Limit (per minute)"}
              </Label>
              <Input
                id="rateLimitPerMinute"
                type="number"
                {...register("rateLimitPerMinute", { valueAsNumber: true })}
                min={1}
                max={1000}
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="isActive"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isActive">
                {isArabic ? "مفعل" : "Active"}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isArabic ? "الأحداث المشترك بها" : "Subscribed Events"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {errors.events && (
            <p className="text-sm text-destructive">{errors.events.message}</p>
          )}

          <Controller
            name="events"
            control={control}
            render={({ field }) => (
              <div className="space-y-6">
                {/* All Events option */}
                <div className="flex items-center space-x-2 border-b pb-4">
                  <Checkbox
                    id="event-all"
                    checked={field.value.includes("*")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange(["*"]);
                      } else {
                        field.onChange([]);
                      }
                    }}
                  />
                  <Label htmlFor="event-all" className="font-medium">
                    {isArabic ? "جميع الأحداث" : "All Events"} (*)
                  </Label>
                </div>

                {/* Event Categories */}
                {Object.entries(EVENT_TYPE_CATEGORIES).map(
                  ([category, { label, labelAr, events }]) => (
                    <div key={category} className="space-y-3">
                      <h4 className="font-medium text-sm">
                        {isArabic ? labelAr : label}
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {events.map((event) => (
                          <div key={event} className="flex items-center space-x-2">
                            <Checkbox
                              id={`event-${event}`}
                              checked={
                                field.value.includes("*") ||
                                field.value.includes(event)
                              }
                              disabled={field.value.includes("*")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, event]);
                                } else {
                                  field.onChange(
                                    field.value.filter((e) => e !== event)
                                  );
                                }
                              }}
                            />
                            <Label
                              htmlFor={`event-${event}`}
                              className="text-sm font-normal"
                            >
                              {event}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isArabic
              ? "جارٍ الحفظ..."
              : "Saving..."
            : webhook
            ? isArabic
              ? "تحديث"
              : "Update"
            : isArabic
            ? "إنشاء"
            : "Create"}
        </Button>
      </div>
    </form>
  );
}
