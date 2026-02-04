"use client";

import { UseFormReturn } from "react-hook-form";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Building2,
  Store,
  UserCog,
  CreditCard,
  Pencil,
  Mail,
  Phone,
  Globe,
  FileText,
  Tag,
  Calendar,
  Percent,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { useActiveClientPlans } from "@liyaqa/shared/queries/platform/use-client-plans";
import { getLocalizedText, cn } from "@liyaqa/shared/utils";
import type { OnboardingFormValues } from "./types";

interface ReviewStepProps {
  form: UseFormReturn<OnboardingFormValues>;
  locale: string;
  onEditStep: (stepIndex: number) => void;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.3 },
  }),
};

export function ReviewStep({ form, locale, onEditStep }: ReviewStepProps) {
  const isRtl = locale === "ar";
  const { watch } = form;
  const values = watch();

  // Fetch plans to show plan name
  const { data: activePlans } = useActiveClientPlans();
  const selectedPlan = activePlans?.find((p) => p.id === values.clientPlanId);

  const texts = {
    title: locale === "ar" ? "مراجعة المعلومات" : "Review Information",
    description:
      locale === "ar"
        ? "راجع جميع المعلومات قبل إنشاء العميل"
        : "Review all information before creating the client",
    organization: locale === "ar" ? "المنظمة" : "Organization",
    club: locale === "ar" ? "النادي" : "Club",
    admin: locale === "ar" ? "حساب المسؤول" : "Admin Account",
    subscription: locale === "ar" ? "الاشتراك" : "Subscription",
    edit: locale === "ar" ? "تعديل" : "Edit",
    name: locale === "ar" ? "الاسم" : "Name",
    tradeName: locale === "ar" ? "الاسم التجاري" : "Trade Name",
    type: locale === "ar" ? "النوع" : "Type",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    website: locale === "ar" ? "الموقع" : "Website",
    vat: locale === "ar" ? "رقم الضريبة" : "VAT Number",
    cr: locale === "ar" ? "السجل التجاري" : "CR Number",
    subdomain: locale === "ar" ? "النطاق الفرعي" : "Subdomain",
    displayName: locale === "ar" ? "اسم العرض" : "Display Name",
    password: locale === "ar" ? "كلمة المرور" : "Password",
    passwordSet: locale === "ar" ? "تم التعيين" : "Set",
    plan: locale === "ar" ? "الخطة" : "Plan",
    price: locale === "ar" ? "السعر" : "Price",
    billing: locale === "ar" ? "دورة الفوترة" : "Billing Cycle",
    contract: locale === "ar" ? "مدة العقد" : "Contract",
    discount: locale === "ar" ? "الخصم" : "Discount",
    trial: locale === "ar" ? "الفترة التجريبية" : "Trial Period",
    months: locale === "ar" ? "شهر" : "months",
    days: locale === "ar" ? "يوم" : "days",
    noSubscription: locale === "ar" ? "لم يتم تحديد اشتراك" : "No subscription selected",
    readyNote:
      locale === "ar"
        ? "بمجرد التأكيد، سيتم إنشاء المنظمة والنادي وحساب المسؤول تلقائياً."
        : "Once confirmed, the organization, club, and admin account will be automatically created.",
  };

  const billingLabels: Record<string, { en: string; ar: string }> = {
    MONTHLY: { en: "Monthly", ar: "شهري" },
    QUARTERLY: { en: "Quarterly", ar: "ربع سنوي" },
    ANNUAL: { en: "Annual", ar: "سنوي" },
  };

  const InfoRow = ({
    icon: Icon,
    label,
    value,
    valueAr,
  }: {
    icon?: typeof Mail;
    label: string;
    value?: string | number | null;
    valueAr?: string | null;
  }) => {
    const displayValue = isRtl && valueAr ? valueAr : value;
    if (!displayValue) return null;

    return (
      <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium">{displayValue}</span>
      </div>
    );
  };

  return (
    <Card className="border-violet-500/20 dark:border-violet-500/30">
      <CardHeader className={cn(isRtl && "text-right")}>
        <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
          <div className="p-2 rounded-lg bg-violet-500/20">
            <CheckCircle2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <CardTitle className="text-lg">{texts.title}</CardTitle>
            <CardDescription className="mt-1">{texts.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Organization Section */}
        <motion.div
          custom={0}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-semibold">{texts.organization}</h4>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(0)} className="h-8 gap-1">
              <Pencil className="h-3 w-3" />
              {texts.edit}
            </Button>
          </div>
          <div className="ps-6 space-y-2 border-s-2 border-blue-200 dark:border-blue-800">
            <p className="font-medium text-base">
              {isRtl && values.organizationNameAr
                ? values.organizationNameAr
                : values.organizationNameEn}
            </p>
            <div className="space-y-1.5">
              <InfoRow label={texts.tradeName} value={values.organizationTradeNameEn} valueAr={values.organizationTradeNameAr} />
              {values.organizationType && (
                <InfoRow label={texts.type} value={values.organizationType} />
              )}
              <InfoRow icon={Mail} label={texts.email} value={values.organizationEmail} />
              <InfoRow icon={Phone} label={texts.phone} value={values.organizationPhone} />
              <InfoRow icon={Globe} label={texts.website} value={values.organizationWebsite} />
              <InfoRow icon={FileText} label={texts.vat} value={values.vatRegistrationNumber} />
              <InfoRow icon={FileText} label={texts.cr} value={values.commercialRegistrationNumber} />
            </div>
          </div>
        </motion.div>

        <Separator />

        {/* Club Section */}
        <motion.div
          custom={1}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-semibold">{texts.club}</h4>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(1)} className="h-8 gap-1">
              <Pencil className="h-3 w-3" />
              {texts.edit}
            </Button>
          </div>
          <div className="ps-6 space-y-2 border-s-2 border-emerald-200 dark:border-emerald-800">
            <p className="font-medium text-base">
              {isRtl && values.clubNameAr ? values.clubNameAr : values.clubNameEn}
            </p>
            {(values.clubDescriptionEn || values.clubDescriptionAr) && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {isRtl && values.clubDescriptionAr
                  ? values.clubDescriptionAr
                  : values.clubDescriptionEn}
              </p>
            )}
            {values.clubSlug && (
              <InfoRow icon={Globe} label={texts.subdomain} value={`${values.clubSlug}.liyaqa.com`} />
            )}
          </div>
        </motion.div>

        <Separator />

        {/* Admin Section */}
        <motion.div
          custom={2}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <UserCog className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h4 className="font-semibold">{texts.admin}</h4>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(2)} className="h-8 gap-1">
              <Pencil className="h-3 w-3" />
              {texts.edit}
            </Button>
          </div>
          <div className="ps-6 space-y-2 border-s-2 border-amber-200 dark:border-amber-800">
            <p className="font-medium text-base">
              {isRtl && values.adminDisplayNameAr
                ? values.adminDisplayNameAr
                : values.adminDisplayNameEn}
            </p>
            <div className="space-y-1.5">
              <InfoRow icon={Mail} label={texts.email} value={values.adminEmail} />
              <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
                <span className="text-muted-foreground">{texts.password}:</span>
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                  {texts.passwordSet}
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        <Separator />

        {/* Subscription Section */}
        <motion.div
          custom={3}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <CreditCard className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <h4 className="font-semibold">{texts.subscription}</h4>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(3)} className="h-8 gap-1">
              <Pencil className="h-3 w-3" />
              {texts.edit}
            </Button>
          </div>
          <div className="ps-6 space-y-2 border-s-2 border-cyan-200 dark:border-cyan-800">
            {values.createSubscription && selectedPlan ? (
              <>
                <p className="font-medium text-base">
                  {getLocalizedText(selectedPlan.name, locale)}
                </p>
                <div className="space-y-1.5">
                  <InfoRow
                    icon={Tag}
                    label={texts.price}
                    value={`${values.agreedPriceAmount || 0} ${values.agreedPriceCurrency}`}
                  />
                  <InfoRow
                    icon={Calendar}
                    label={texts.billing}
                    value={
                      values.billingCycle
                        ? isRtl
                          ? billingLabels[values.billingCycle]?.ar
                          : billingLabels[values.billingCycle]?.en
                        : "Monthly"
                    }
                  />
                  {values.contractMonths && (
                    <InfoRow
                      icon={Calendar}
                      label={texts.contract}
                      value={`${values.contractMonths} ${texts.months}`}
                    />
                  )}
                  {values.discountPercentage && values.discountPercentage > 0 && (
                    <InfoRow
                      icon={Percent}
                      label={texts.discount}
                      value={`${values.discountPercentage}%`}
                    />
                  )}
                  {values.startWithTrial && values.trialDays && (
                    <InfoRow
                      icon={Calendar}
                      label={texts.trial}
                      value={`${values.trialDays} ${texts.days}`}
                    />
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">{texts.noSubscription}</p>
            )}
          </div>
        </motion.div>

        {/* Ready Note */}
        <motion.div
          custom={4}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900",
            isRtl && "flex-row-reverse text-right"
          )}
        >
          <CheckCircle2 className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0" />
          <p className="text-sm text-violet-800 dark:text-violet-200">{texts.readyNote}</p>
        </motion.div>
      </CardContent>
    </Card>
  );
}
