"use client";

import { useLocale } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { User, Tag, FileText, CreditCard } from "lucide-react";
import type { EnrollmentFormData } from "../enrollment-schemas";
import { useActivePlans } from "@liyaqa/shared/queries/use-plans";

interface ReviewStepProps {
  form: UseFormReturn<EnrollmentFormData>;
}

export function ReviewStep({ form }: ReviewStepProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const values = form.getValues();
  const { data: plans } = useActivePlans();

  const selectedPlan = plans?.find((p) => p.id === values.planId);
  const planName = selectedPlan
    ? isAr ? (selectedPlan.name.ar || selectedPlan.name.en) : selectedPlan.name.en
    : values.planId;

  const texts = {
    reviewTitle: isAr ? "مراجعة التسجيل" : "Review Enrollment",
    reviewDesc: isAr ? "راجع جميع التفاصيل قبل التأكيد" : "Review all details before confirming",
    member: isAr ? "العضو" : "Member",
    plan: isAr ? "الخطة" : "Plan",
    contract: isAr ? "العقد" : "Contract",
    payment: isAr ? "الدفع" : "Payment",
    name: isAr ? "الاسم" : "Name",
    email: isAr ? "البريد الإلكتروني" : "Email",
    phone: isAr ? "الهاتف" : "Phone",
    type: isAr ? "النوع" : "Type",
    newMember: isAr ? "عضو جديد" : "New Member",
    existingMember: isAr ? "عضو حالي" : "Existing Member",
    startDate: isAr ? "تاريخ البدء" : "Start Date",
    autoRenew: isAr ? "تجديد تلقائي" : "Auto-renew",
    yes: isAr ? "نعم" : "Yes",
    no: isAr ? "لا" : "No",
    contractType: isAr ? "نوع العقد" : "Contract Type",
    contractTerm: isAr ? "مدة العقد" : "Contract Term",
    monthToMonth: isAr ? "شهري" : "Month-to-Month",
    fixedTerm: isAr ? "محدد المدة" : "Fixed Term",
    paymentMethod: isAr ? "طريقة الدفع" : "Payment Method",
    amount: isAr ? "المبلغ" : "Amount",
    voucher: isAr ? "القسيمة" : "Voucher",
    discount: isAr ? "خصم" : "Discount",
    staffNotes: isAr ? "ملاحظات الموظف" : "Staff Notes",
    staffNotesPlaceholder: isAr ? "أي ملاحظات إضافية..." : "Any additional notes...",
    notSet: isAr ? "غير محدد" : "Not set",
  };

  const memberName = values.memberType === "new"
    ? `${values.firstNameEn || ""} ${values.lastNameEn || ""}`.trim()
    : values.existingMemberId || texts.notSet;

  const contractTypeLabel = values.contractType === "FIXED_TERM" ? texts.fixedTerm : texts.monthToMonth;

  const termLabels: Record<string, string> = {
    MONTHLY: isAr ? "شهري" : "Monthly",
    QUARTERLY: isAr ? "ربع سنوي" : "Quarterly",
    SEMI_ANNUAL: isAr ? "نصف سنوي" : "Semi-Annual",
    ANNUAL: isAr ? "سنوي" : "Annual",
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{texts.reviewTitle}</h3>
        <p className="text-sm text-muted-foreground">{texts.reviewDesc}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Member summary */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">{texts.member}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <SummaryRow
              label={texts.type}
              value={
                <Badge variant="secondary">
                  {values.memberType === "new" ? texts.newMember : texts.existingMember}
                </Badge>
              }
            />
            <SummaryRow label={texts.name} value={memberName} />
            {values.memberType === "new" && (
              <>
                <SummaryRow label={texts.email} value={values.email || texts.notSet} />
                <SummaryRow label={texts.phone} value={values.phone || texts.notSet} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Plan summary */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">{texts.plan}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <SummaryRow label={texts.plan} value={planName} />
            <SummaryRow label={texts.startDate} value={values.startDate || new Date().toISOString().split("T")[0]} />
            <SummaryRow label={texts.autoRenew} value={values.autoRenew ? texts.yes : texts.no} />
          </CardContent>
        </Card>

        {/* Contract summary */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">{texts.contract}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <SummaryRow label={texts.contractType} value={contractTypeLabel} />
            <SummaryRow label={texts.contractTerm} value={termLabels[values.contractTerm] || values.contractTerm} />
          </CardContent>
        </Card>

        {/* Payment summary */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">{texts.payment}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <SummaryRow label={texts.paymentMethod} value={values.paymentMethod || texts.notSet} />
            <SummaryRow label={texts.amount} value={values.paidAmount ? `${values.paidAmount} SAR` : texts.notSet} />
            {values.voucherCode && <SummaryRow label={texts.voucher} value={values.voucherCode} />}
            {values.discountType && (
              <SummaryRow label={texts.discount} value={`${values.discountValue} (${values.discountType})`} />
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Staff notes */}
      <div className="space-y-2">
        <Label>{texts.staffNotes}</Label>
        <Textarea
          {...form.register("staffNotes")}
          placeholder={texts.staffNotesPlaceholder}
          rows={3}
        />
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium">{value}</span>
    </div>
  );
}
