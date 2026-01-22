"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocalizedText } from "@/components/ui/localized-text";
import type { MembershipPlan } from "@/types/member";

// Zod schema for subscription form
const subscriptionFormSchema = z.object({
  memberId: z.string().uuid("Member is required"),
  planId: z.string().uuid("Plan is required"),
  startDate: z.string().optional(),
});

export type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>;

interface SubscriptionFormProps {
  memberId?: string;
  memberName?: string;
  plans: MembershipPlan[];
  onSubmit: (data: SubscriptionFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isLoadingPlans?: boolean;
}

export function SubscriptionForm({
  memberId,
  memberName,
  plans,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isLoadingPlans = false,
}: SubscriptionFormProps) {
  const locale = useLocale();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      memberId: memberId || "",
      planId: "",
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  const watchPlanId = watch("planId");
  const selectedPlan = plans.find((p) => p.id === watchPlanId);

  const texts = {
    title: locale === "ar" ? "اشتراك جديد" : "New Subscription",
    description:
      locale === "ar"
        ? "إنشاء اشتراك جديد للعضو"
        : "Create a new subscription for the member",
    member: locale === "ar" ? "العضو" : "Member",
    plan: locale === "ar" ? "الخطة" : "Plan",
    selectPlan: locale === "ar" ? "اختر خطة" : "Select a plan",
    startDate: locale === "ar" ? "تاريخ البدء" : "Start Date",
    planDetails: locale === "ar" ? "تفاصيل الخطة" : "Plan Details",
    duration: locale === "ar" ? "المدة" : "Duration",
    days: locale === "ar" ? "يوم" : "days",
    type: locale === "ar" ? "النوع" : "Type",
    unlimited: locale === "ar" ? "غير محدود" : "Unlimited",
    limited: locale === "ar" ? "محدود" : "Limited",
    classes: locale === "ar" ? "حصص" : "classes",
    price: locale === "ar" ? "السعر" : "Price",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    create: locale === "ar" ? "إنشاء الاشتراك" : "Create Subscription",
    creating: locale === "ar" ? "جاري الإنشاء..." : "Creating...",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{texts.title}</CardTitle>
          <CardDescription>{texts.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Member (read-only if provided) */}
          {memberId && memberName && (
            <div className="space-y-2">
              <Label>{texts.member}</Label>
              <Input value={memberName} disabled />
              <input type="hidden" {...register("memberId")} />
            </div>
          )}

          {/* Plan Selection */}
          <div className="space-y-2">
            <Label>{texts.plan} *</Label>
            <Select
              value={watchPlanId}
              onValueChange={(value) => setValue("planId", value)}
              disabled={isLoadingPlans}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={isLoadingPlans ? texts.loading : texts.selectPlan}
                />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    <LocalizedText text={plan.name} /> -{" "}
                    {plan.price.amount} {plan.price.currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.planId && (
              <p className="text-sm text-destructive">
                {errors.planId.message}
              </p>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">{texts.startDate}</Label>
            <Input id="startDate" type="date" {...register("startDate")} />
          </div>

          {/* Plan Details Preview */}
          {selectedPlan && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{texts.planDetails}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{texts.duration}</span>
                  <span>
                    {selectedPlan.durationDays} {texts.days}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{texts.type}</span>
                  <span>
                    {selectedPlan.type === "UNLIMITED"
                      ? texts.unlimited
                      : `${texts.limited} (${selectedPlan.classLimit} ${texts.classes})`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">{texts.price}</span>
                  <span>
                    {selectedPlan.price.amount} {selectedPlan.price.currency}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {texts.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? texts.creating : texts.create}
        </Button>
      </div>
    </form>
  );
}
