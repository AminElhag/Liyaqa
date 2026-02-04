"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  Trophy,
  Lock,
  Sparkles,
  User,
  MapPin,
  CreditCard,
  Users,
  FileText,
  DoorOpen,
  Calendar,
  UserPlus,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Progress } from "@liyaqa/shared/components/ui/progress";
import { cn } from "@liyaqa/shared/utils";

/**
 * Onboarding step definition
 */
interface OnboardingStep {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  points: number;
  category: string;
  categoryAr: string;
  icon: React.ReactNode;
  href: string;
  completed: boolean;
}

/**
 * Unlockable feature
 */
interface UnlockableFeature {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  requiredPoints: number;
  unlocked: boolean;
  icon: React.ReactNode;
}

/**
 * Props for the OnboardingChecklist component
 */
interface OnboardingChecklistProps {
  organizationName: string;
  totalPoints: number;
  maxPoints: number;
  progressPercent: number;
  completedSteps: string[];
  unlockedFeatures: string[];
  onStepClick?: (stepId: string) => void;
  className?: string;
}

/**
 * Step configuration
 */
const stepConfig: Omit<OnboardingStep, "completed">[] = [
  {
    id: "ACCOUNT_CREATED",
    name: "Account Created",
    nameAr: "تم إنشاء الحساب",
    description: "Your account has been set up",
    descriptionAr: "تم إعداد حسابك",
    points: 10,
    category: "Account",
    categoryAr: "الحساب",
    icon: <User className="h-5 w-5" />,
    href: "#",
  },
  {
    id: "EMAIL_VERIFIED",
    name: "Verify Email",
    nameAr: "تحقق من البريد",
    description: "Confirm your email address",
    descriptionAr: "قم بتأكيد عنوان بريدك الإلكتروني",
    points: 5,
    category: "Account",
    categoryAr: "الحساب",
    icon: <Check className="h-5 w-5" />,
    href: "/settings/profile",
  },
  {
    id: "PROFILE_COMPLETED",
    name: "Complete Profile",
    nameAr: "أكمل الملف الشخصي",
    description: "Add your gym's details and branding",
    descriptionAr: "أضف تفاصيل صالتك والعلامة التجارية",
    points: 10,
    category: "Account",
    categoryAr: "الحساب",
    icon: <User className="h-5 w-5" />,
    href: "/settings/profile",
  },
  {
    id: "FIRST_LOCATION_ADDED",
    name: "Add Your Location",
    nameAr: "أضف موقعك",
    description: "Set up your first gym location",
    descriptionAr: "قم بإعداد موقع صالتك الأول",
    points: 15,
    category: "Setup",
    categoryAr: "الإعداد",
    icon: <MapPin className="h-5 w-5" />,
    href: "/locations/new",
  },
  {
    id: "MEMBERSHIP_PLANS_CREATED",
    name: "Create Membership Plans",
    nameAr: "أنشئ خطط العضوية",
    description: "Set up pricing and membership tiers",
    descriptionAr: "قم بإعداد الأسعار ومستويات العضوية",
    points: 20,
    category: "Setup",
    categoryAr: "الإعداد",
    icon: <FileText className="h-5 w-5" />,
    href: "/settings/membership-plans",
  },
  {
    id: "FIRST_MEMBER_ADDED",
    name: "Add Your First Member",
    nameAr: "أضف أول عضو",
    description: "Register your first gym member",
    descriptionAr: "سجل أول عضو في صالتك",
    points: 10,
    category: "Members",
    categoryAr: "الأعضاء",
    icon: <UserPlus className="h-5 w-5" />,
    href: "/members/new",
  },
  {
    id: "MEMBERS_IMPORTED",
    name: "Import Members",
    nameAr: "استورد الأعضاء",
    description: "Bulk import members from a spreadsheet",
    descriptionAr: "استورد الأعضاء بكميات كبيرة من جدول بيانات",
    points: 15,
    category: "Members",
    categoryAr: "الأعضاء",
    icon: <Users className="h-5 w-5" />,
    href: "/members/import",
  },
  {
    id: "PAYMENT_GATEWAY_CONNECTED",
    name: "Connect Payment Gateway",
    nameAr: "اربط بوابة الدفع",
    description: "Set up STC Pay, SADAD, or Stripe",
    descriptionAr: "قم بإعداد STC Pay أو سداد أو Stripe",
    points: 20,
    category: "Payments",
    categoryAr: "المدفوعات",
    icon: <CreditCard className="h-5 w-5" />,
    href: "/settings/payments",
  },
  {
    id: "FIRST_PAYMENT_RECEIVED",
    name: "Receive First Payment",
    nameAr: "استلم أول دفعة",
    description: "Process your first member payment",
    descriptionAr: "قم بمعالجة أول دفعة من عضو",
    points: 10,
    category: "Payments",
    categoryAr: "المدفوعات",
    icon: <CreditCard className="h-5 w-5" />,
    href: "/billing",
  },
  {
    id: "ACCESS_CONTROL_CONFIGURED",
    name: "Set Up Access Control",
    nameAr: "قم بإعداد التحكم في الوصول",
    description: "Configure door access with Kisi",
    descriptionAr: "قم بتكوين الوصول للأبواب مع Kisi",
    points: 15,
    category: "Operations",
    categoryAr: "العمليات",
    icon: <DoorOpen className="h-5 w-5" />,
    href: "/settings/access-control",
  },
  {
    id: "FIRST_CLASS_SCHEDULED",
    name: "Schedule Your First Class",
    nameAr: "جدول أول صفك",
    description: "Create a class on your schedule",
    descriptionAr: "أنشئ صفًا في جدولك",
    points: 10,
    category: "Operations",
    categoryAr: "العمليات",
    icon: <Calendar className="h-5 w-5" />,
    href: "/classes/new",
  },
  {
    id: "STAFF_INVITED",
    name: "Invite Staff",
    nameAr: "ادع الموظفين",
    description: "Add team members to help manage",
    descriptionAr: "أضف أعضاء الفريق للمساعدة في الإدارة",
    points: 10,
    category: "Team",
    categoryAr: "الفريق",
    icon: <UserPlus className="h-5 w-5" />,
    href: "/settings/team",
  },
  {
    id: "MOBILE_APP_CONFIGURED",
    name: "Configure Mobile App",
    nameAr: "قم بتكوين التطبيق",
    description: "Set up your branded mobile app",
    descriptionAr: "قم بإعداد تطبيقك المحمول بعلامتك التجارية",
    points: 15,
    category: "Engagement",
    categoryAr: "التفاعل",
    icon: <Smartphone className="h-5 w-5" />,
    href: "/settings/mobile-app",
  },
];

/**
 * Feature configuration
 */
const featureConfig: UnlockableFeature[] = [
  {
    id: "MARKETING",
    name: "Marketing Suite",
    nameAr: "جناح التسويق",
    description: "Email campaigns, segmentation, automation",
    descriptionAr: "حملات البريد الإلكتروني والتقسيم والأتمتة",
    requiredPoints: 60,
    unlocked: false,
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: "REPORTS",
    name: "Advanced Reports",
    nameAr: "التقارير المتقدمة",
    description: "Custom dashboards and analytics",
    descriptionAr: "لوحات التحكم المخصصة والتحليلات",
    requiredPoints: 90,
    unlocked: false,
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "API",
    name: "API Access",
    nameAr: "الوصول لواجهة برمجة التطبيقات",
    description: "Build custom integrations",
    descriptionAr: "بناء تكاملات مخصصة",
    requiredPoints: 165,
    unlocked: false,
    icon: <Lock className="h-5 w-5" />,
  },
];

/**
 * OnboardingChecklist Component
 * Displays gamified onboarding progress with steps and feature unlocking.
 */
export function OnboardingChecklist({
  organizationName,
  totalPoints,
  maxPoints,
  progressPercent,
  completedSteps,
  unlockedFeatures,
  onStepClick,
  className,
}: OnboardingChecklistProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const texts = {
    title: isRtl ? `ابدأ مع ${organizationName}` : `Get Started with ${organizationName}`,
    subtitle: isRtl ? "أكمل هذه الخطوات لتحقيق أقصى استفادة من لياقة" : "Complete these steps to get the most out of Liyaqa",
    points: isRtl ? "نقطة" : "pts",
    complete: isRtl ? "مكتمل" : "Complete",
    unlockAt: isRtl ? "يفتح عند" : "Unlocks at",
    unlocked: isRtl ? "مفتوح" : "Unlocked",
    viewAll: isRtl ? "عرض الكل" : "View All",
    collapse: isRtl ? "طي" : "Collapse",
  };

  // Build steps with completion status
  const steps: OnboardingStep[] = stepConfig.map((step) => ({
    ...step,
    completed: completedSteps.includes(step.id),
  }));

  // Build features with unlock status
  const features: UnlockableFeature[] = featureConfig.map((feature) => ({
    ...feature,
    unlocked: unlockedFeatures.includes(feature.id) || totalPoints >= feature.requiredPoints,
  }));

  // Group steps by category
  const categories = Array.from(new Set(steps.map((s) => s.category)));
  const stepsByCategory = categories.map((cat) => ({
    category: cat,
    categoryAr: steps.find((s) => s.category === cat)?.categoryAr || cat,
    steps: steps.filter((s) => s.category === cat),
  }));

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              {texts.title}
            </CardTitle>
            <CardDescription className="mt-1">{texts.subtitle}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{totalPoints}</div>
            <div className="text-xs text-muted-foreground">/ {maxPoints} {texts.points}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{progressPercent}% {texts.complete}</span>
            <span>{completedSteps.length} / {steps.length}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Feature Unlocks */}
        <div className="p-4 border-b bg-muted/30">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {isRtl ? "فتح الميزات" : "Feature Unlocks"}
          </h4>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {features.map((feature) => (
              <div
                key={feature.id}
                className={cn(
                  "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border",
                  feature.unlocked
                    ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                    : "bg-muted/50 border-muted"
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-full",
                    feature.unlocked ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                  )}
                >
                  {feature.unlocked ? <Check className="h-3 w-3" /> : feature.icon}
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {isRtl ? feature.nameAr : feature.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {feature.unlocked
                      ? texts.unlocked
                      : `${texts.unlockAt} ${feature.requiredPoints} ${texts.points}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Steps by Category */}
        <div className="divide-y">
          {stepsByCategory.map(({ category, categoryAr, steps: categorySteps }) => {
            const completedInCategory = categorySteps.filter((s) => s.completed).length;
            const isExpanded = expandedCategory === category;

            return (
              <div key={category}>
                {/* Category Header */}
                <button
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                        completedInCategory === categorySteps.length
                          ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {completedInCategory === categorySteps.length ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        `${completedInCategory}/${categorySteps.length}`
                      )}
                    </div>
                    <span className="font-medium">{isRtl ? categoryAr : category}</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                </button>

                {/* Category Steps */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t bg-muted/20"
                  >
                    {categorySteps.map((step) => (
                      <Link
                        key={step.id}
                        href={step.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors",
                          step.completed && "opacity-60"
                        )}
                        onClick={() => onStepClick?.(step.id)}
                      >
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            step.completed
                              ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          {step.completed ? <Check className="h-4 w-4" /> : step.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {isRtl ? step.nameAr : step.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {isRtl ? step.descriptionAr : step.description}
                          </div>
                        </div>
                        <Badge variant={step.completed ? "secondary" : "outline"} className="text-xs">
                          +{step.points} {texts.points}
                        </Badge>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default OnboardingChecklist;
