import type { UseFormReturn } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useActiveClientPlans } from "@/hooks/use-client-plans";
import { getLocalizedText, cn } from "@/lib/utils";
import type { ConvertDealFormValues } from "./types";

interface ReviewStepProps {
  form: UseFormReturn<ConvertDealFormValues>;
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

function InfoRow({
  icon: Icon,
  label,
  value,
  valueAr,
  isRtl,
}: {
  icon?: typeof Mail;
  label: string;
  value?: string | number | null;
  valueAr?: string | null;
  isRtl: boolean;
}) {
  const displayValue = isRtl && valueAr ? valueAr : value;
  if (!displayValue) return null;

  return (
    <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{displayValue}</span>
    </div>
  );
}

export function ReviewStep({ form, locale, onEditStep }: ReviewStepProps) {
  const isRtl = locale === "ar";
  const { watch } = form;
  const values = watch();

  // Fetch plans to show plan name
  const { data: activePlans } = useActiveClientPlans();
  const selectedPlan = activePlans?.find((p) => p.id === values.clientPlanId);

  const texts = {
    title: locale === "ar" ? "\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A" : "Review Information",
    description:
      locale === "ar"
        ? "\u0631\u0627\u062C\u0639 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0642\u0628\u0644 \u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0635\u0641\u0642\u0629 \u0625\u0644\u0649 \u0639\u0645\u064A\u0644"
        : "Review all information before converting the deal to a client",
    organization: locale === "ar" ? "\u0627\u0644\u0645\u0646\u0638\u0645\u0629" : "Organization",
    club: locale === "ar" ? "\u0627\u0644\u0646\u0627\u062F\u064A" : "Club",
    admin: locale === "ar" ? "\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u0624\u0648\u0644" : "Admin Account",
    subscription: locale === "ar" ? "\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643" : "Subscription",
    edit: locale === "ar" ? "\u062A\u0639\u062F\u064A\u0644" : "Edit",
    name: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645" : "Name",
    tradeName: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u062A\u062C\u0627\u0631\u064A" : "Trade Name",
    type: locale === "ar" ? "\u0627\u0644\u0646\u0648\u0639" : "Type",
    email: locale === "ar" ? "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" : "Email",
    phone: locale === "ar" ? "\u0627\u0644\u0647\u0627\u062A\u0641" : "Phone",
    website: locale === "ar" ? "\u0627\u0644\u0645\u0648\u0642\u0639" : "Website",
    vat: locale === "ar" ? "\u0631\u0642\u0645 \u0627\u0644\u0636\u0631\u064A\u0628\u0629" : "VAT Number",
    cr: locale === "ar" ? "\u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u062A\u062C\u0627\u0631\u064A" : "CR Number",
    displayName: locale === "ar" ? "\u0627\u0633\u0645 \u0627\u0644\u0639\u0631\u0636" : "Display Name",
    password: locale === "ar" ? "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" : "Password",
    passwordSet: locale === "ar" ? "\u062A\u0645 \u0627\u0644\u062A\u0639\u064A\u064A\u0646" : "Set",
    plan: locale === "ar" ? "\u0627\u0644\u062E\u0637\u0629" : "Plan",
    price: locale === "ar" ? "\u0627\u0644\u0633\u0639\u0631" : "Price",
    billing: locale === "ar" ? "\u062F\u0648\u0631\u0629 \u0627\u0644\u0641\u0648\u062A\u0631\u0629" : "Billing Cycle",
    contract: locale === "ar" ? "\u0645\u062F\u0629 \u0627\u0644\u0639\u0642\u062F" : "Contract",
    discount: locale === "ar" ? "\u0627\u0644\u062E\u0635\u0645" : "Discount",
    trial: locale === "ar" ? "\u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u062A\u062C\u0631\u064A\u0628\u064A\u0629" : "Trial Period",
    months: locale === "ar" ? "\u0634\u0647\u0631" : "months",
    days: locale === "ar" ? "\u064A\u0648\u0645" : "days",
    noSubscription: locale === "ar" ? "\u0644\u0645 \u064A\u062A\u0645 \u062A\u062D\u062F\u064A\u062F \u0627\u0634\u062A\u0631\u0627\u0643" : "No subscription selected",
    readyNote:
      locale === "ar"
        ? "\u0628\u0645\u062C\u0631\u062F \u0627\u0644\u062A\u0623\u0643\u064A\u062F\u060C \u0633\u064A\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0646\u0638\u0645\u0629 \u0648\u0627\u0644\u0646\u0627\u062F\u064A \u0648\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B."
        : "Once confirmed, the organization, club, and admin account will be automatically created.",
  };

  const billingLabels: Record<string, { en: string; ar: string }> = {
    MONTHLY: { en: "Monthly", ar: "\u0634\u0647\u0631\u064A" },
    QUARTERLY: { en: "Quarterly", ar: "\u0631\u0628\u0639 \u0633\u0646\u0648\u064A" },
    ANNUAL: { en: "Annual", ar: "\u0633\u0646\u0648\u064A" },
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
              <InfoRow label={texts.tradeName} value={values.organizationTradeNameEn} valueAr={values.organizationTradeNameAr} isRtl={isRtl} />
              {values.organizationType && (
                <InfoRow label={texts.type} value={values.organizationType} isRtl={isRtl} />
              )}
              <InfoRow icon={Mail} label={texts.email} value={values.organizationEmail} isRtl={isRtl} />
              <InfoRow icon={Phone} label={texts.phone} value={values.organizationPhone} isRtl={isRtl} />
              <InfoRow icon={Globe} label={texts.website} value={values.organizationWebsite} isRtl={isRtl} />
              <InfoRow icon={FileText} label={texts.vat} value={values.vatRegistrationNumber} isRtl={isRtl} />
              <InfoRow icon={FileText} label={texts.cr} value={values.commercialRegistrationNumber} isRtl={isRtl} />
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
              <InfoRow icon={Mail} label={texts.email} value={values.adminEmail} isRtl={isRtl} />
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
                    isRtl={isRtl}
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
                    isRtl={isRtl}
                  />
                  {values.contractMonths && (
                    <InfoRow
                      icon={Calendar}
                      label={texts.contract}
                      value={`${values.contractMonths} ${texts.months}`}
                      isRtl={isRtl}
                    />
                  )}
                  {values.discountPercentage && values.discountPercentage > 0 && (
                    <InfoRow
                      icon={Percent}
                      label={texts.discount}
                      value={`${values.discountPercentage}%`}
                      isRtl={isRtl}
                    />
                  )}
                  {values.startWithTrial && values.trialDays && (
                    <InfoRow
                      icon={Calendar}
                      label={texts.trial}
                      value={`${values.trialDays} ${texts.days}`}
                      isRtl={isRtl}
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
