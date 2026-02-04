"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Building2, FileText, Calendar, DollarSign } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { usePlatformClients } from "@liyaqa/shared/queries/platform/use-platform-clients";
import { useClientSubscriptions } from "@liyaqa/shared/queries/platform/use-client-subscriptions";
import {
  useCreateClientInvoice,
  useUpdateClientInvoice,
} from "@liyaqa/shared/queries/platform/use-client-invoices";
import type { ClientInvoice, ClientInvoiceLineItemType, CreateLineItemRequest } from "@liyaqa/shared/types/platform/client-invoice";
import type { LocalizedText } from "@liyaqa/shared/types/api";

const LINE_ITEM_TYPES: { value: ClientInvoiceLineItemType; label: { en: string; ar: string } }[] = [
  { value: "SUBSCRIPTION", label: { en: "Subscription", ar: "اشتراك" } },
  { value: "SETUP_FEE", label: { en: "Setup Fee", ar: "رسوم التأسيس" } },
  { value: "SERVICE", label: { en: "Service", ar: "خدمة" } },
  { value: "INTEGRATION", label: { en: "Integration", ar: "تكامل" } },
  { value: "DISCOUNT", label: { en: "Discount", ar: "خصم" } },
  { value: "OTHER", label: { en: "Other", ar: "أخرى" } },
];

const lineItemSchema = z.object({
  descriptionEn: z.string().min(1, "Description is required"),
  descriptionAr: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1").default(1),
  unitPriceAmount: z.coerce.number().min(0, "Price must be positive"),
  itemType: z.enum(["SUBSCRIPTION", "SETUP_FEE", "SERVICE", "INTEGRATION", "DISCOUNT", "OTHER"]).default("SERVICE"),
});

const invoiceFormSchema = z.object({
  organizationId: z.string().uuid("Please select an organization"),
  subscriptionId: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  vatRate: z.coerce.number().min(0).max(100).default(15),
  billingPeriodStart: z.string().optional(),
  billingPeriodEnd: z.string().optional(),
  notesEn: z.string().optional(),
  notesAr: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoice?: ClientInvoice;
  mode: "create" | "edit";
}

function getLocalizedText(text: LocalizedText | undefined, locale: string): string {
  if (!text) return "";
  return locale === "ar" ? text.ar || text.en : text.en;
}

export function InvoiceForm({ invoice, mode }: InvoiceFormProps) {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedOrgId, setSelectedOrgId] = useState<string>(invoice?.organizationId || "");

  // Fetch data
  const { data: clientsData, isLoading: loadingClients } = usePlatformClients({ size: 100 });
  const { data: subscriptionsData, isLoading: loadingSubscriptions } = useClientSubscriptions(
    { organizationId: selectedOrgId, size: 100 },
    { enabled: !!selectedOrgId }
  );

  // Mutations
  const createInvoice = useCreateClientInvoice();
  const updateInvoice = useUpdateClientInvoice();

  const clients = clientsData?.content || [];
  const subscriptions = subscriptionsData?.content || [];

  const texts = {
    // Headers
    organizationSection: locale === "ar" ? "المؤسسة والاشتراك" : "Organization & Subscription",
    lineItemsSection: locale === "ar" ? "بنود الفاتورة" : "Line Items",
    billingPeriodSection: locale === "ar" ? "فترة الفوترة" : "Billing Period",
    notesSection: locale === "ar" ? "الملاحظات" : "Notes",

    // Fields
    organization: locale === "ar" ? "المؤسسة" : "Organization",
    subscription: locale === "ar" ? "الاشتراك" : "Subscription",
    selectOrganization: locale === "ar" ? "اختر مؤسسة" : "Select organization",
    selectSubscription: locale === "ar" ? "اختر اشتراك (اختياري)" : "Select subscription (optional)",
    noOrganizations: locale === "ar" ? "لا توجد مؤسسات" : "No organizations",
    noSubscriptions: locale === "ar" ? "لا توجد اشتراكات" : "No subscriptions",
    description: locale === "ar" ? "الوصف" : "Description",
    descriptionEn: locale === "ar" ? "الوصف (إنجليزي)" : "Description (English)",
    descriptionAr: locale === "ar" ? "الوصف (عربي)" : "Description (Arabic)",
    quantity: locale === "ar" ? "الكمية" : "Qty",
    unitPrice: locale === "ar" ? "سعر الوحدة" : "Unit Price",
    type: locale === "ar" ? "النوع" : "Type",
    total: locale === "ar" ? "الإجمالي" : "Total",
    addLineItem: locale === "ar" ? "إضافة بند" : "Add Line Item",
    removeLineItem: locale === "ar" ? "حذف البند" : "Remove",
    billingPeriodStart: locale === "ar" ? "بداية الفترة" : "Period Start",
    billingPeriodEnd: locale === "ar" ? "نهاية الفترة" : "Period End",
    vatRate: locale === "ar" ? "نسبة الضريبة (%)" : "VAT Rate (%)",
    notesEn: locale === "ar" ? "ملاحظات (إنجليزي)" : "Notes (English)",
    notesAr: locale === "ar" ? "ملاحظات (عربي)" : "Notes (Arabic)",

    // Actions
    save: locale === "ar" ? "حفظ" : "Save",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
    createSuccess: locale === "ar" ? "تم إنشاء الفاتورة بنجاح" : "Invoice created successfully",
    updateSuccess: locale === "ar" ? "تم تحديث الفاتورة بنجاح" : "Invoice updated successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      organizationId: invoice?.organizationId || "",
      subscriptionId: invoice?.subscriptionId || "",
      lineItems: invoice?.lineItems.map((item) => ({
        descriptionEn: item.description.en,
        descriptionAr: item.description.ar || "",
        quantity: item.quantity,
        unitPriceAmount: item.unitPrice.amount,
        itemType: item.itemType,
      })) || [
        {
          descriptionEn: "",
          descriptionAr: "",
          quantity: 1,
          unitPriceAmount: 0,
          itemType: "SERVICE" as ClientInvoiceLineItemType,
        },
      ],
      vatRate: invoice?.vatRate || 15,
      billingPeriodStart: invoice?.billingPeriodStart?.split("T")[0] || "",
      billingPeriodEnd: invoice?.billingPeriodEnd?.split("T")[0] || "",
      notesEn: invoice?.notes?.en || "",
      notesAr: invoice?.notes?.ar || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const watchedOrgId = watch("organizationId");
  const watchedLineItems = watch("lineItems");
  const watchedVatRate = watch("vatRate");

  useEffect(() => {
    if (watchedOrgId !== selectedOrgId) {
      setSelectedOrgId(watchedOrgId);
      setValue("subscriptionId", "");
    }
  }, [watchedOrgId, selectedOrgId, setValue]);

  // Calculate totals
  const subtotal = watchedLineItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPriceAmount || 0);
  }, 0);
  const vatAmount = subtotal * ((watchedVatRate || 0) / 100);
  const totalAmount = subtotal + vatAmount;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 2,
    }).format(amount);

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      if (mode === "create") {
        const lineItems: CreateLineItemRequest[] = data.lineItems.map((item) => ({
          descriptionEn: item.descriptionEn,
          descriptionAr: item.descriptionAr || undefined,
          quantity: item.quantity,
          unitPriceAmount: item.unitPriceAmount,
          unitPriceCurrency: "SAR",
          itemType: item.itemType,
        }));

        await createInvoice.mutateAsync({
          organizationId: data.organizationId,
          subscriptionId: data.subscriptionId || undefined,
          lineItems,
          vatRate: data.vatRate,
          billingPeriodStart: data.billingPeriodStart || undefined,
          billingPeriodEnd: data.billingPeriodEnd || undefined,
          notesEn: data.notesEn || undefined,
          notesAr: data.notesAr || undefined,
        });

        toast({ title: texts.createSuccess });
        router.push(`/${locale}/client-invoices`);
      } else if (invoice) {
        await updateInvoice.mutateAsync({
          id: invoice.id,
          data: {
            notesEn: data.notesEn || undefined,
            notesAr: data.notesAr || undefined,
          },
        });

        toast({ title: texts.updateSuccess });
        router.push(`/${locale}/client-invoices/${invoice.id}`);
      }
    } catch (error) {
      toast({
        title: texts.errorTitle,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (loadingClients) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Organization & Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>{texts.organizationSection}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organizationId">{texts.organization}</Label>
              <Select
                value={watch("organizationId")}
                onValueChange={(value) => setValue("organizationId", value)}
                disabled={mode === "edit"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectOrganization} />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="py-2 px-3 text-sm text-muted-foreground">
                      {texts.noOrganizations}
                    </div>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {getLocalizedText(client.name, locale)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.organizationId && (
                <p className="text-sm text-destructive">{errors.organizationId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionId">{texts.subscription}</Label>
              <Select
                value={watch("subscriptionId") || ""}
                onValueChange={(value) => setValue("subscriptionId", value === "none" ? "" : value)}
                disabled={mode === "edit" || !selectedOrgId || loadingSubscriptions}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectSubscription} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {subscriptions.length === 0 ? (
                    <div className="py-2 px-3 text-sm text-muted-foreground">
                      {texts.noSubscriptions}
                    </div>
                  ) : (
                    subscriptions.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.id.slice(0, 8)}... - {sub.status}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items - Only show in create mode */}
      {mode === "create" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>{texts.lineItemsSection}</CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    descriptionEn: "",
                    descriptionAr: "",
                    quantity: 1,
                    unitPriceAmount: 0,
                    itemType: "SERVICE",
                  })
                }
              >
                <Plus className="me-2 h-4 w-4" />
                {texts.addLineItem}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-4 p-4 border rounded-lg bg-muted/20"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{texts.descriptionEn}</Label>
                    <Input
                      {...register(`lineItems.${index}.descriptionEn`)}
                      placeholder="Service description..."
                    />
                    {errors.lineItems?.[index]?.descriptionEn && (
                      <p className="text-sm text-destructive">
                        {errors.lineItems[index]?.descriptionEn?.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{texts.descriptionAr}</Label>
                    <Input
                      {...register(`lineItems.${index}.descriptionAr`)}
                      placeholder="وصف الخدمة..."
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>{texts.type}</Label>
                    <Select
                      value={watch(`lineItems.${index}.itemType`)}
                      onValueChange={(value) =>
                        setValue(`lineItems.${index}.itemType`, value as ClientInvoiceLineItemType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LINE_ITEM_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {locale === "ar" ? type.label.ar : type.label.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{texts.quantity}</Label>
                    <Input
                      type="number"
                      min="1"
                      {...register(`lineItems.${index}.quantity`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{texts.unitPrice}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register(`lineItems.${index}.unitPriceAmount`)}
                    />
                  </div>
                  <div className="flex items-end">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="me-2 h-4 w-4" />
                        {texts.removeLineItem}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {errors.lineItems && typeof errors.lineItems.message === "string" && (
              <p className="text-sm text-destructive">{errors.lineItems.message}</p>
            )}

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT ({watchedVatRate}%)</span>
                  <span className="font-medium">{formatCurrency(vatAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">{texts.total}</span>
                  <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Period - Only show in create mode */}
      {mode === "create" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>{texts.billingPeriodSection}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="billingPeriodStart">{texts.billingPeriodStart}</Label>
                <Input type="date" {...register("billingPeriodStart")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingPeriodEnd">{texts.billingPeriodEnd}</Label>
                <Input type="date" {...register("billingPeriodEnd")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatRate">{texts.vatRate}</Label>
                <Input type="number" min="0" max="100" step="0.01" {...register("vatRate")} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle>{texts.notesSection}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="notesEn">{texts.notesEn}</Label>
              <Textarea
                {...register("notesEn")}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notesAr">{texts.notesAr}</Label>
              <Textarea
                {...register("notesAr")}
                placeholder="ملاحظات إضافية..."
                dir="rtl"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          {texts.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? texts.saving : texts.save}
        </Button>
      </div>
    </form>
  );
}
