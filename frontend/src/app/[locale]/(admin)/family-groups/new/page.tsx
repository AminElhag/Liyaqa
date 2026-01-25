"use client";

import { useState } from "react";
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
import { useCreateFamilyGroup } from "@/queries/use-family-groups";
import type { FamilyBillingType } from "@/types/accounts";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  primaryMemberId: z.string().uuid("Valid member ID is required"),
  maxMembers: z.coerce.number().min(2).max(10).default(5),
  discountPercentage: z.coerce.number().min(0).max(100).default(0),
  billingType: z.enum(["INDIVIDUAL", "PRIMARY_PAYS_ALL", "SPLIT"]).default("INDIVIDUAL"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const billingTypeOptions: { value: FamilyBillingType; labelEn: string; labelAr: string }[] = [
  { value: "INDIVIDUAL", labelEn: "Individual Billing", labelAr: "فواتير فردية" },
  { value: "PRIMARY_PAYS_ALL", labelEn: "Primary Pays All", labelAr: "الرئيسي يدفع الكل" },
  { value: "SPLIT", labelEn: "Split Billing", labelAr: "فواتير مقسمة" },
];

export default function NewFamilyGroupPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateFamilyGroup();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      primaryMemberId: "",
      maxMembers: 5,
      discountPercentage: 0,
      billingType: "INDIVIDUAL",
      notes: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await createMutation.mutateAsync(data);
      toast({
        title: locale === "ar" ? "تم الإنشاء بنجاح" : "Created successfully",
        description: locale === "ar" ? "تم إنشاء مجموعة العائلة" : "Family group has been created",
      });
      router.push(`/${locale}/family-groups/${result.id}`);
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في إنشاء مجموعة العائلة" : "Failed to create family group",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/family-groups`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {locale === "ar" ? "إنشاء مجموعة عائلية" : "Create Family Group"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "إنشاء مجموعة عائلية جديدة"
              : "Create a new family group"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{locale === "ar" ? "تفاصيل المجموعة" : "Group Details"}</CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "أدخل معلومات المجموعة العائلية"
              : "Enter the family group information"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{locale === "ar" ? "اسم المجموعة" : "Group Name"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={locale === "ar" ? "عائلة الأحمد" : "The Smith Family"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primaryMemberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{locale === "ar" ? "العضو الرئيسي" : "Primary Member ID"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={locale === "ar" ? "معرف العضو الرئيسي" : "Primary member UUID"}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {locale === "ar"
                        ? "معرف العضو الذي سيكون المسؤول عن المجموعة"
                        : "The member who will be the group administrator"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="maxMembers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{locale === "ar" ? "الحد الأقصى للأعضاء" : "Max Members"}</FormLabel>
                      <FormControl>
                        <Input type="number" min={2} max={10} {...field} />
                      </FormControl>
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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{locale === "ar" ? "ملاحظات" : "Notes"}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={locale === "ar" ? "ملاحظات إضافية..." : "Additional notes..."}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Link href={`/${locale}/family-groups`}>
                  <Button variant="outline" type="button">
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                </Link>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {locale === "ar" ? "إنشاء المجموعة" : "Create Group"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
