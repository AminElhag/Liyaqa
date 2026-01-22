"use client";

import { UseFormReturn } from "react-hook-form";
import { useLocale } from "next-intl";
import { Check, Calendar, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { usePlans } from "@/queries/use-plans";
import { useAuthStore } from "@/stores/auth-store";
import type { RegistrationData } from "../schemas/registration-schema";
import type { MembershipPlan } from "@/types/member";

interface SubscriptionStepProps {
  form: UseFormReturn<RegistrationData>;
}

export function SubscriptionStep({ form }: SubscriptionStepProps) {
  const locale = useLocale();
  const { register, setValue, watch, formState: { errors } } = form;
  const { user } = useAuthStore();

  const { data: plansData, isLoading } = usePlans({ active: true });
  const plans = plansData?.content || [];

  const selectedPlanId = watch("subscription.planId");
  const discountPercentage = watch("subscription.discountPercentage") || 0;

  // Role-based maximum discount
  const getMaxDiscount = () => {
    switch (user?.role) {
      case "SUPER_ADMIN":
        return 100;
      case "CLUB_ADMIN":
        return 50;
      case "STAFF":
        return 20;
      default:
        return 0;
    }
  };

  const maxDiscount = getMaxDiscount();
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Calculate discounted price
  const calculatePrice = (plan: MembershipPlan) => {
    const originalPrice = plan.price.amount;
    const discount = discountPercentage / 100;
    const discountedPrice = originalPrice * (1 - discount);
    return {
      original: originalPrice,
      discounted: discountedPrice,
      savings: originalPrice - discountedPrice,
    };
  };

  const texts = {
    planTitle: locale === "ar" ? "اختر خطة العضوية" : "Select Membership Plan",
    planDescription:
      locale === "ar"
        ? "اختر الخطة المناسبة للعضو"
        : "Choose the appropriate plan for the member",
    selectPlan: locale === "ar" ? "اختر خطة" : "Select a plan",
    perPeriod: {
      DAILY: locale === "ar" ? "/ يوم" : "/ day",
      WEEKLY: locale === "ar" ? "/ أسبوع" : "/ week",
      BIWEEKLY: locale === "ar" ? "/ أسبوعين" : "/ 2 weeks",
      MONTHLY: locale === "ar" ? "/ شهر" : "/ month",
      QUARTERLY: locale === "ar" ? "/ 3 أشهر" : "/ quarter",
      YEARLY: locale === "ar" ? "/ سنة" : "/ year",
      ONE_TIME: locale === "ar" ? "مرة واحدة" : "one-time",
    },
    unlimited: locale === "ar" ? "غير محدود" : "Unlimited",
    limited: locale === "ar" ? "محدود" : "Limited",
    classes: locale === "ar" ? "حصص" : "classes",
    days: locale === "ar" ? "يوم" : "days",
    startDateTitle: locale === "ar" ? "تاريخ البدء" : "Start Date",
    startDateDescription:
      locale === "ar"
        ? "متى يجب أن تبدأ العضوية؟"
        : "When should the membership start?",
    startDate: locale === "ar" ? "تاريخ البدء" : "Start Date",
    discountTitle: locale === "ar" ? "الخصم" : "Discount",
    discountDescription:
      locale === "ar"
        ? `يمكنك تطبيق خصم يصل إلى ${maxDiscount}%`
        : `You can apply a discount up to ${maxDiscount}%`,
    discountPercentage: locale === "ar" ? "نسبة الخصم" : "Discount Percentage",
    discountReason: locale === "ar" ? "سبب الخصم" : "Discount Reason",
    originalPrice: locale === "ar" ? "السعر الأصلي" : "Original Price",
    discountedPrice: locale === "ar" ? "السعر بعد الخصم" : "Discounted Price",
    savings: locale === "ar" ? "التوفير" : "Savings",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading plans...",
    noPlans: locale === "ar" ? "لا توجد خطط متاحة" : "No plans available",
    noPermission:
      locale === "ar"
        ? "ليس لديك صلاحية لتطبيق الخصومات"
        : "You don't have permission to apply discounts",
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{texts.loading}</p>
        </CardContent>
      </Card>
    );
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{texts.noPlans}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.planTitle}</CardTitle>
          <CardDescription>{texts.planDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const name = locale === "ar" ? plan.name.ar || plan.name.en : plan.name.en;
              const description = plan.description
                ? locale === "ar"
                  ? plan.description.ar || plan.description.en
                  : plan.description.en
                : null;

              return (
                <div
                  key={plan.id}
                  onClick={() => setValue("subscription.planId", plan.id)}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <h3 className="font-semibold">{name}</h3>
                    {description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {description}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">
                        {plan.price.amount}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {plan.price.currency}{" "}
                        {texts.perPeriod[plan.billingPeriod]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline">
                        {plan.type === "UNLIMITED"
                          ? texts.unlimited
                          : `${plan.classLimit} ${texts.classes}`}
                      </Badge>
                      <Badge variant="outline">
                        {plan.durationDays} {texts.days}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {errors.subscription?.planId && (
            <p className="text-sm text-destructive mt-2">
              {errors.subscription.planId.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Start Date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {texts.startDateTitle}
          </CardTitle>
          <CardDescription>{texts.startDateDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label htmlFor="subscription.startDate">{texts.startDate}</Label>
            <Input
              id="subscription.startDate"
              type="date"
              {...register("subscription.startDate")}
              defaultValue={new Date().toISOString().split("T")[0]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Discount Section */}
      {maxDiscount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              {texts.discountTitle}
            </CardTitle>
            <CardDescription>{texts.discountDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{texts.discountPercentage}</Label>
                <span className="font-bold text-lg">{discountPercentage}%</span>
              </div>
              <Slider
                value={[discountPercentage]}
                onValueChange={(value: number[]) =>
                  setValue("subscription.discountPercentage", value[0])
                }
                max={maxDiscount}
                step={1}
              />
            </div>

            {discountPercentage > 0 && (
              <div className="space-y-2">
                <Label htmlFor="subscription.discountReason">
                  {texts.discountReason}
                </Label>
                <Textarea
                  id="subscription.discountReason"
                  {...register("subscription.discountReason")}
                  placeholder="Employee discount, special promotion, etc."
                  rows={2}
                />
              </div>
            )}

            {/* Price Preview */}
            {selectedPlan && discountPercentage > 0 && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{texts.originalPrice}:</span>
                  <span className="line-through text-muted-foreground">
                    {calculatePrice(selectedPlan).original.toFixed(2)}{" "}
                    {selectedPlan.price.currency}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>{texts.discountedPrice}:</span>
                  <span className="text-primary">
                    {calculatePrice(selectedPlan).discounted.toFixed(2)}{" "}
                    {selectedPlan.price.currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>{texts.savings}:</span>
                  <span>
                    {calculatePrice(selectedPlan).savings.toFixed(2)}{" "}
                    {selectedPlan.price.currency}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {maxDiscount === 0 && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground text-center">
              {texts.noPermission}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
