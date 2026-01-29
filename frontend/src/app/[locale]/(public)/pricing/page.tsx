"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Check, X, Sparkles, Building2, Rocket, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePublicPlans } from "@/queries/use-public-plans";
import { FEATURE_LABELS, PRICING_DISPLAY_FEATURES, type PublicClientPlan } from "@/types/public-plans";

// Icons for plans by index (fallback for dynamic plans)
const PLAN_ICONS = [
  <Rocket key="rocket" className="h-6 w-6" />,
  <Building2 key="building" className="h-6 w-6" />,
  <Crown key="crown" className="h-6 w-6" />,
];

function PricingCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="text-center pb-4">
        <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-24 mx-auto mb-2" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-center mb-6">
          <Skeleton className="h-10 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
        <div className="grid grid-cols-3 gap-2 mb-6 p-4 bg-muted/50 rounded-lg">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

function formatLimit(value: number, isRtl: boolean, texts: ReturnType<typeof getTexts>): string {
  const isUnlimited = value >= 999999 || value >= 999;
  if (isUnlimited) {
    return texts.unlimited;
  }
  return value.toLocaleString(isRtl ? "ar-SA" : "en-US");
}

function getTexts(isRtl: boolean) {
  return {
    title: isRtl ? "اختر الخطة المناسبة لصالتك الرياضية" : "Choose the Right Plan for Your Gym",
    subtitle: isRtl
      ? "ابدأ بتجربة مجانية لمدة 14 يومًا. لا حاجة لبطاقة ائتمان."
      : "Start with a 14-day free trial. No credit card required.",
    monthly: isRtl ? "شهري" : "Monthly",
    annual: isRtl ? "سنوي" : "Annual",
    savePercent: (percent: number) => (isRtl ? `وفر ${percent}%` : `Save ${percent}%`),
    perMonth: isRtl ? "/ شهر" : "/mo",
    billedAnnually: isRtl ? "تدفع سنويًا" : "billed annually",
    startTrial: isRtl ? "ابدأ تجربة مجانية" : "Start Free Trial",
    contactSales: isRtl ? "تواصل مع المبيعات" : "Contact Sales",
    mostPopular: isRtl ? "الأكثر شعبية" : "Most Popular",
    members: isRtl ? "عضو" : "members",
    locations: isRtl ? "موقع" : "locations",
    staff: isRtl ? "موظف" : "staff",
    unlimited: isRtl ? "غير محدود" : "Unlimited",
    loadError: isRtl ? "تعذر تحميل الأسعار" : "Unable to load pricing",
    noPlans: isRtl ? "لا توجد خطط متاحة حالياً" : "No pricing plans available",
    contactUs: isRtl ? "تواصل معنا" : "Contact us",
    faq: {
      title: isRtl ? "الأسئلة الشائعة" : "Frequently Asked Questions",
      questions: [
        {
          q: isRtl ? "هل يمكنني تغيير خطتي لاحقًا؟" : "Can I change my plan later?",
          a: isRtl
            ? "نعم، يمكنك الترقية أو التخفيض في أي وقت. ستتم محاسبتك بالتناسب."
            : "Yes, you can upgrade or downgrade at any time. You'll be prorated accordingly.",
        },
        {
          q: isRtl ? "ماذا يحدث بعد انتهاء التجربة المجانية؟" : "What happens after the free trial?",
          a: isRtl
            ? "ستحتاج إلى إدخال طريقة دفع للاستمرار. لن يتم فقدان أي بيانات."
            : "You'll need to enter a payment method to continue. No data will be lost.",
        },
        {
          q: isRtl ? "هل هناك رسوم إعداد؟" : "Are there any setup fees?",
          a: isRtl
            ? "لا، لا توجد رسوم إعداد. ادفع فقط رسوم اشتراكك الشهرية أو السنوية."
            : "No, there are no setup fees. Just pay your monthly or annual subscription.",
        },
      ],
    },
  };
}

function getFeatureLabel(featureKey: string, locale: string): string {
  const labels = FEATURE_LABELS[featureKey];
  if (!labels) {
    // Fallback: convert camelCase to readable text
    return featureKey.replace(/^has/, "").replace(/([A-Z])/g, " $1").trim();
  }
  return locale === "ar" ? labels.ar : labels.en;
}

export default function PricingPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [isAnnual, setIsAnnual] = useState(true);
  const texts = getTexts(isRtl);

  const { data: plans, isLoading, error } = usePublicPlans();

  // Determine which plan is "popular" - default to middle plan
  const getIsPopular = (index: number, total: number) => {
    if (total <= 1) return false;
    if (total === 2) return index === 1;
    return index === Math.floor(total / 2);
  };

  // Check if plan is enterprise-level (unlimited everything or last plan)
  const isEnterprise = (plan: PublicClientPlan, index: number, total: number) => {
    const hasUnlimitedAll =
      plan.maxMembers >= 999999 &&
      plan.maxLocationsPerClub >= 999 &&
      plan.maxClubs >= 999;
    return hasUnlimitedAll || index === total - 1;
  };

  // Calculate average savings percent for toggle label
  const avgSavingsPercent = plans && plans.length > 0
    ? Math.round(plans.reduce((sum, p) => sum + p.annualSavingsPercent, 0) / plans.length)
    : 17;

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{texts.title}</h1>
          <p className="text-xl text-muted-foreground mb-8">{texts.subtitle}</p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={cn("text-sm", !isAnnual && "font-semibold")}>{texts.monthly}</span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span className={cn("text-sm", isAnnual && "font-semibold")}>
              {texts.annual}
              <Badge variant="secondary" className="ms-2 text-xs">
                {texts.savePercent(avgSavingsPercent)}
              </Badge>
            </span>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCardSkeleton />
            <PricingCardSkeleton />
            <PricingCardSkeleton />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{texts.loadError}</p>
            <Link href={`/${locale}/signup`}>
              <Button>{texts.contactUs}</Button>
            </Link>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && plans?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{texts.noPlans}</p>
            <Link href={`/${locale}/signup`}>
              <Button>{texts.contactUs}</Button>
            </Link>
          </div>
        )}

        {/* Pricing Cards */}
        {!isLoading && !error && plans && plans.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const popular = getIsPopular(index, plans.length);
              const enterprise = isEnterprise(plan, index, plans.length);
              const icon = PLAN_ICONS[index % PLAN_ICONS.length];

              // Calculate display price based on billing toggle
              const displayPrice = isAnnual
                ? Math.round(plan.effectiveMonthlyPriceAnnual.amount)
                : Math.round(plan.monthlyPrice.amount);

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col",
                    popular && "border-primary shadow-lg scale-105 z-10"
                  )}
                >
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">
                        <Sparkles className="h-3 w-3 me-1" />
                        {texts.mostPopular}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 text-primary">
                      {icon}
                    </div>
                    <CardTitle className="text-2xl">
                      {isRtl ? (plan.name.ar || plan.name.en) : plan.name.en}
                    </CardTitle>
                    <CardDescription>
                      {plan.description
                        ? (isRtl ? (plan.description.ar || plan.description.en) : plan.description.en)
                        : ""}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    {/* Price */}
                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-sm text-muted-foreground">SAR</span>
                        <span className="text-4xl font-bold">
                          {displayPrice.toLocaleString(isRtl ? "ar-SA" : "en-US")}
                        </span>
                        <span className="text-muted-foreground">{texts.perMonth}</span>
                      </div>
                      {isAnnual && (
                        <p className="text-sm text-muted-foreground mt-1">
                          SAR {Math.round(plan.annualPrice.amount).toLocaleString(isRtl ? "ar-SA" : "en-US")} {texts.billedAnnually}
                        </p>
                      )}
                    </div>

                    {/* Limits */}
                    <div className="grid grid-cols-3 gap-2 text-center mb-6 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-semibold">
                          {formatLimit(plan.maxMembers, isRtl, texts)}
                        </div>
                        <div className="text-xs text-muted-foreground">{texts.members}</div>
                      </div>
                      <div>
                        <div className="font-semibold">
                          {formatLimit(plan.maxLocationsPerClub * plan.maxClubs, isRtl, texts)}
                        </div>
                        <div className="text-xs text-muted-foreground">{texts.locations}</div>
                      </div>
                      <div>
                        <div className="font-semibold">
                          {formatLimit(plan.maxStaffUsers, isRtl, texts)}
                        </div>
                        <div className="text-xs text-muted-foreground">{texts.staff}</div>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3">
                      {PRICING_DISPLAY_FEATURES.map((featureKey) => {
                        const included = plan.features[featureKey] ?? false;
                        const label = getFeatureLabel(featureKey, locale);
                        return (
                          <li key={featureKey} className="flex items-center gap-2">
                            {included ? (
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                            )}
                            <span
                              className={cn(
                                "text-sm",
                                !included && "text-muted-foreground/50"
                              )}
                            >
                              {label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Link
                      href={
                        enterprise
                          ? `/${locale}/signup?plan=${plan.id}&contact=true`
                          : `/${locale}/signup?plan=${plan.id}&billing=${isAnnual ? "annual" : "monthly"}`
                      }
                      className="w-full"
                    >
                      <Button
                        className="w-full"
                        variant={popular ? "default" : "outline"}
                        size="lg"
                      >
                        {enterprise ? texts.contactSales : texts.startTrial}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-24">
          <h2 className="text-3xl font-bold text-center mb-8">{texts.faq.title}</h2>
          <div className="space-y-6">
            {texts.faq.questions.map((item, idx) => (
              <div key={idx} className="border-b pb-6">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
