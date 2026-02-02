"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "next-intl";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  updateClientSchema,
  type UpdateClientFormValues,
} from "@/lib/validations/trainer-client";
import type { TrainerClientResponse } from "@/types/trainer-portal";

interface ClientEditFormProps {
  client: TrainerClientResponse;
  onSubmit: (data: UpdateClientFormValues) => void;
  isLoading: boolean;
}

export function ClientEditForm({
  client,
  onSubmit,
  isLoading,
}: ClientEditFormProps) {
  const locale = useLocale();

  const texts = {
    status: locale === "ar" ? "الحالة" : "Status",
    statusDescription: locale === "ar" ? "حدد حالة العميل الحالية" : "Select the current client status",
    goalsEn: locale === "ar" ? "الأهداف (إنجليزي)" : "Goals (English)",
    goalsEnDescription: locale === "ar" ? "أهداف العميل باللغة الإنجليزية" : "Client goals in English",
    goalsAr: locale === "ar" ? "الأهداف (عربي)" : "Goals (Arabic)",
    goalsArDescription: locale === "ar" ? "أهداف العميل باللغة العربية" : "Client goals in Arabic",
    notesEn: locale === "ar" ? "الملاحظات (إنجليزي)" : "Notes (English)",
    notesEnDescription: locale === "ar" ? "ملاحظات التدريب باللغة الإنجليزية" : "Training notes in English",
    notesAr: locale === "ar" ? "الملاحظات (عربي)" : "Notes (Arabic)",
    notesArDescription: locale === "ar" ? "ملاحظات التدريب باللغة العربية" : "Training notes in Arabic",
    save: locale === "ar" ? "حفظ التغييرات" : "Save Changes",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    // Status options
    active: locale === "ar" ? "نشط" : "Active",
    onHold: locale === "ar" ? "معلق" : "On Hold",
    completed: locale === "ar" ? "مكتمل" : "Completed",
    inactive: locale === "ar" ? "غير نشط" : "Inactive",
  };

  const form = useForm<UpdateClientFormValues>({
    resolver: zodResolver(updateClientSchema),
    defaultValues: {
      goalsEn: client.goalsEn || "",
      goalsAr: client.goalsAr || "",
      notesEn: client.notesEn || "",
      notesAr: client.notesAr || "",
      status: client.status,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Status Select */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{texts.status}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={texts.status} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACTIVE">{texts.active}</SelectItem>
                  <SelectItem value="ON_HOLD">{texts.onHold}</SelectItem>
                  <SelectItem value="COMPLETED">{texts.completed}</SelectItem>
                  <SelectItem value="INACTIVE">{texts.inactive}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>{texts.statusDescription}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Goals EN */}
        <FormField
          control={form.control}
          name="goalsEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{texts.goalsEn}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={texts.goalsEn}
                  className="min-h-[100px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>{texts.goalsEnDescription}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Goals AR */}
        <FormField
          control={form.control}
          name="goalsAr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{texts.goalsAr}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={texts.goalsAr}
                  className="min-h-[100px] resize-y"
                  dir="rtl"
                  {...field}
                />
              </FormControl>
              <FormDescription>{texts.goalsArDescription}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes EN */}
        <FormField
          control={form.control}
          name="notesEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{texts.notesEn}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={texts.notesEn}
                  className="min-h-[150px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>{texts.notesEnDescription}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes AR */}
        <FormField
          control={form.control}
          name="notesAr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{texts.notesAr}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={texts.notesAr}
                  className="min-h-[150px] resize-y"
                  dir="rtl"
                  {...field}
                />
              </FormControl>
              <FormDescription>{texts.notesArDescription}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {texts.save}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            {texts.cancel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
