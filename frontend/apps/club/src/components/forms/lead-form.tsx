"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@liyaqa/shared/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import type { Lead, CreateLeadRequest, LeadSource, LeadPriority } from "@liyaqa/shared/types/lead";
import { LEAD_SOURCE_LABELS, LEAD_PRIORITY_LABELS } from "@liyaqa/shared/types/lead";

const leadFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  source: z.enum([
    "REFERRAL",
    "WALK_IN",
    "SOCIAL_MEDIA",
    "PAID_ADS",
    "WEBSITE",
    "PHONE_CALL",
    "EMAIL",
    "PARTNER",
    "EVENT",
    "OTHER",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  notes: z.string().optional(),
  expectedConversionDate: z.string().optional(),
  campaignSource: z.string().optional(),
  campaignMedium: z.string().optional(),
  campaignName: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: CreateLeadRequest) => Promise<void>;
  isPending: boolean;
}

export function LeadForm({ lead, onSubmit, isPending }: LeadFormProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: lead?.name || "",
      email: lead?.email || "",
      phone: lead?.phone || "",
      source: lead?.source || "WALK_IN",
      priority: lead?.priority || undefined,
      notes: lead?.notes || "",
      expectedConversionDate: lead?.expectedConversionDate || "",
      campaignSource: lead?.campaignSource || "",
      campaignMedium: lead?.campaignMedium || "",
      campaignName: lead?.campaignName || "",
    },
  });

  const handleSubmit = async (values: LeadFormValues) => {
    await onSubmit({
      name: values.name,
      email: values.email,
      phone: values.phone || undefined,
      source: values.source as LeadSource,
      priority: values.priority as LeadPriority | undefined,
      notes: values.notes || undefined,
      expectedConversionDate: values.expectedConversionDate || undefined,
      campaignSource: values.campaignSource || undefined,
      campaignMedium: values.campaignMedium || undefined,
      campaignName: values.campaignName || undefined,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isArabic ? "معلومات أساسية" : "Basic Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? "الاسم" : "Name"} *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={isArabic ? "أدخل الاسم" : "Enter name"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? "البريد الإلكتروني" : "Email"} *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={isArabic ? "أدخل البريد الإلكتروني" : "Enter email"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? "رقم الهاتف" : "Phone"}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={isArabic ? "أدخل رقم الهاتف" : "Enter phone number"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? "المصدر" : "Source"} *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(LEAD_SOURCE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {isArabic ? label.ar : label.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? "الأولوية" : "Priority"}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isArabic ? "اختر الأولوية" : "Select priority"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(LEAD_PRIORITY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {isArabic ? label.ar : label.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expectedConversionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isArabic ? "تاريخ التحويل المتوقع" : "Expected Conversion Date"}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isArabic ? "ملاحظات" : "Notes"}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={isArabic ? "أدخل أي ملاحظات" : "Enter any notes"}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Campaign Attribution */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isArabic ? "معلومات الحملة" : "Campaign Attribution"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="campaignSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? "مصدر الحملة" : "Campaign Source"}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="google, facebook" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="campaignMedium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? "وسيلة الحملة" : "Campaign Medium"}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="cpc, email, social" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="campaignName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isArabic ? "اسم الحملة" : "Campaign Name"}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="summer_promo_2026" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {lead
              ? isArabic ? "تحديث" : "Update"
              : isArabic ? "إنشاء" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
