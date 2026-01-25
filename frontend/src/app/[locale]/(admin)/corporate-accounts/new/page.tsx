"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateCorporateAccount } from "@/queries/use-corporate-accounts";
import type { CorporateBillingType } from "@/types/accounts";

const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyNameAr: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  crNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  address: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  maxMembers: z.coerce.number().min(1).optional(),
  discountPercentage: z.coerce.number().min(0).max(100).default(0),
  billingType: z.enum(["INVOICE", "PREPAID", "MONTHLY"]).default("INVOICE"),
  paymentTermsDays: z.coerce.number().min(0).max(90).default(30),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const billingTypeOptions: { value: CorporateBillingType; labelEn: string; labelAr: string }[] = [
  { value: "INVOICE", labelEn: "Invoice", labelAr: "فاتورة" },
  { value: "PREPAID", labelEn: "Prepaid", labelAr: "مدفوع مقدماً" },
  { value: "MONTHLY", labelEn: "Monthly", labelAr: "شهري" },
];

export default function NewCorporateAccountPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateCorporateAccount();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      companyNameAr: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      crNumber: "",
      vatNumber: "",
      address: "",
      contractStartDate: "",
      contractEndDate: "",
      maxMembers: undefined,
      discountPercentage: 0,
      billingType: "INVOICE",
      paymentTermsDays: 30,
      notes: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Clean up empty strings
      const cleanData = {
        ...data,
        companyNameAr: data.companyNameAr || undefined,
        contactPerson: data.contactPerson || undefined,
        contactEmail: data.contactEmail || undefined,
        contactPhone: data.contactPhone || undefined,
        crNumber: data.crNumber || undefined,
        vatNumber: data.vatNumber || undefined,
        address: data.address || undefined,
        contractStartDate: data.contractStartDate || undefined,
        contractEndDate: data.contractEndDate || undefined,
        notes: data.notes || undefined,
      };

      const result = await createMutation.mutateAsync(cleanData);
      toast({
        title: locale === "ar" ? "تم الإنشاء بنجاح" : "Created successfully",
        description: locale === "ar" ? "تم إنشاء الحساب المؤسسي" : "Corporate account has been created",
      });
      router.push(`/${locale}/corporate-accounts/${result.id}`);
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في إنشاء الحساب المؤسسي" : "Failed to create corporate account",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/corporate-accounts`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {locale === "ar" ? "إنشاء حساب مؤسسي" : "Create Corporate Account"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "إنشاء حساب جديد لشركة أو مؤسسة"
              : "Create a new corporate or business account"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{locale === "ar" ? "معلومات الشركة" : "Company Information"}</CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "المعلومات الأساسية عن الشركة"
                  : "Basic information about the company"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{locale === "ar" ? "اسم الشركة (إنجليزي)" : "Company Name (English)"}</FormLabel>
                      <FormControl>
                        <Input placeholder="Company Name Ltd" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyNameAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{locale === "ar" ? "اسم الشركة (عربي)" : "Company Name (Arabic)"}</FormLabel>
                      <FormControl>
                        <Input placeholder="شركة المثال" dir="rtl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="crNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{locale === "ar" ? "رقم السجل التجاري" : "CR Number"}</FormLabel>
                      <FormControl>
                        <Input placeholder="1010XXXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vatNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{locale === "ar" ? "الرقم الضريبي" : "VAT Number"}</FormLabel>
                      <FormControl>
                        <Input placeholder="3XXXXXXXXXXXXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{locale === "ar" ? "العنوان" : "Address"}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={locale === "ar" ? "عنوان الشركة..." : "Company address..."}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{locale === "ar" ? "معلومات التواصل" : "Contact Information"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{locale === "ar" ? "اسم جهة الاتصال" : "Contact Person"}</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{locale === "ar" ? "البريد الإلكتروني" : "Email"}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{locale === "ar" ? "رقم الهاتف" : "Phone"}</FormLabel>
                      <FormControl>
                        <Input placeholder="+966 5X XXX XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{locale === "ar" ? "تفاصيل العقد" : "Contract Details"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contractStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{locale === "ar" ? "تاريخ بدء العقد" : "Contract Start Date"}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contractEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{locale === "ar" ? "تاريخ انتهاء العقد" : "Contract End Date"}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="maxMembers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{locale === "ar" ? "الحد الأقصى للموظفين" : "Max Employees"}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} placeholder="Unlimited" {...field} />
                      </FormControl>
                      <FormDescription>
                        {locale === "ar" ? "اتركه فارغاً للحد غير المحدود" : "Leave empty for unlimited"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{locale === "ar" ? "نسبة الخصم %" : "Discount %"}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentTermsDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{locale === "ar" ? "أيام السداد" : "Payment Terms (days)"}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={90} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="billingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{locale === "ar" ? "نوع الفوترة" : "Billing Type"}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {billingTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {locale === "ar" ? option.labelAr : option.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{locale === "ar" ? "ملاحظات إضافية" : "Additional Notes"}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder={locale === "ar" ? "ملاحظات..." : "Notes..."}
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href={`/${locale}/corporate-accounts`}>
              <Button variant="outline" type="button">
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
            </Link>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {locale === "ar" ? "إنشاء الحساب" : "Create Account"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
