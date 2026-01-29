"use client";

import { useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Calendar, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { MembershipContract } from "@/types/contract";

interface ContractViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: MembershipContract | null;
}

export function ContractViewDialog({
  open,
  onOpenChange,
  contract,
}: ContractViewDialogProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  if (!contract) return null;

  const getStatusBadge = () => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; labelEn: string; labelAr: string }> = {
      PENDING_SIGNATURE: { variant: "outline", labelEn: "Pending Signature", labelAr: "في انتظار التوقيع" },
      ACTIVE: { variant: "default", labelEn: "Active", labelAr: "نشط" },
      IN_NOTICE_PERIOD: { variant: "secondary", labelEn: "In Notice Period", labelAr: "في فترة الإشعار" },
      CANCELLED: { variant: "destructive", labelEn: "Cancelled", labelAr: "ملغي" },
      EXPIRED: { variant: "secondary", labelEn: "Expired", labelAr: "منتهي" },
      SUSPENDED: { variant: "destructive", labelEn: "Suspended", labelAr: "معلق" },
      VOIDED: { variant: "destructive", labelEn: "Voided", labelAr: "ملغى" },
    };

    const config = statusConfig[contract.status] || { variant: "outline", labelEn: contract.status, labelAr: contract.status };

    return (
      <Badge variant={config.variant}>
        {isArabic ? config.labelAr : config.labelEn}
      </Badge>
    );
  };

  const getContractTypeLabel = () => {
    if (contract.contractType === "FIXED_TERM") {
      return isArabic ? "عقد محدد المدة" : "Fixed Term Contract";
    }
    return isArabic ? "عقد شهري" : "Month-to-Month";
  };

  const getContractTermLabel = () => {
    const terms: Record<string, { en: string; ar: string }> = {
      MONTHLY: { en: "Monthly", ar: "شهري" },
      QUARTERLY: { en: "Quarterly (3 months)", ar: "ربع سنوي (3 أشهر)" },
      SEMI_ANNUAL: { en: "Semi-Annual (6 months)", ar: "نصف سنوي (6 أشهر)" },
      ANNUAL: { en: "Annual (12 months)", ar: "سنوي (12 شهر)" },
    };
    const term = terms[contract.contractTerm];
    return term ? (isArabic ? term.ar : term.en) : contract.contractTerm;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>
              {isArabic ? "تفاصيل العقد" : "Contract Details"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isArabic ? "عقد رقم" : "Contract #"}: {contract.contractNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {isArabic ? "الحالة" : "Status"}
            </span>
            {getStatusBadge()}
          </div>

          <Separator />

          {/* Contract Type */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {isArabic ? "نوع العقد" : "Contract Type"}
            </h4>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">
                  {isArabic ? "النوع" : "Type"}
                </dt>
                <dd className="font-medium">{getContractTypeLabel()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {isArabic ? "المدة" : "Term"}
                </dt>
                <dd className="font-medium">{getContractTermLabel()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {isArabic ? "تاريخ البدء" : "Start Date"}
                </dt>
                <dd className="font-medium">
                  {new Date(contract.startDate).toLocaleDateString(
                    isArabic ? "ar-SA" : undefined
                  )}
                </dd>
              </div>
              {contract.commitmentEndDate && (
                <div>
                  <dt className="text-muted-foreground">
                    {isArabic ? "نهاية الالتزام" : "Commitment End"}
                  </dt>
                  <dd className="font-medium">
                    {new Date(contract.commitmentEndDate).toLocaleDateString(
                      isArabic ? "ar-SA" : undefined
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {isArabic ? "الأسعار المقفلة" : "Locked Pricing"}
            </h4>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {isArabic ? "الرسوم الشهرية" : "Monthly Fee"}
                </span>
                <span className="font-bold text-lg">
                  {contract.lockedMonthlyFee} {contract.lockedCurrency}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isArabic
                  ? "* هذا السعر مقفل طوال مدة العقد"
                  : "* This rate is locked for the duration of your contract"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Terms */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {isArabic ? "الشروط" : "Terms"}
            </h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {isArabic ? "فترة الإشعار" : "Notice Period"}
                </dt>
                <dd className="font-medium">
                  {contract.noticePeriodDays} {isArabic ? "يوم" : "days"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {isArabic ? "رسوم الإنهاء المبكر" : "Early Termination"}
                </dt>
                <dd className="font-medium">
                  {contract.earlyTerminationFeeType === "NONE"
                    ? isArabic
                      ? "لا توجد رسوم"
                      : "No fee"
                    : contract.earlyTerminationFeeType === "REMAINING_MONTHS"
                    ? isArabic
                      ? "الأشهر المتبقية"
                      : "Remaining months"
                    : contract.earlyTerminationFeeType === "FLAT_FEE"
                    ? isArabic
                      ? "رسوم ثابتة"
                      : "Flat fee"
                    : isArabic
                    ? "نسبة مئوية"
                    : "Percentage"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Cooling-off */}
          {contract.isWithinCoolingOff && (
            <>
              <Separator />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">
                      {isArabic
                        ? "فترة التراجع"
                        : "Cooling-Off Period"}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      {isArabic
                        ? `يمكنك الإلغاء مع استرداد كامل حتى ${new Date(
                            contract.coolingOffEndDate
                          ).toLocaleDateString("ar-SA")}`
                        : `You can cancel with full refund until ${new Date(
                            contract.coolingOffEndDate
                          ).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Signature Info */}
          {contract.memberSignedAt && (
            <>
              <Separator />
              <div className="text-sm text-muted-foreground">
                <p>
                  {isArabic ? "تم التوقيع في" : "Signed on"}{" "}
                  {new Date(contract.memberSignedAt).toLocaleString(
                    isArabic ? "ar-SA" : undefined
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
