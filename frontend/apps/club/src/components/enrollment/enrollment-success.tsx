"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { CheckCircle2, User, Printer, UserPlus } from "lucide-react";
import type { EnrollmentResponse } from "@liyaqa/shared/types/enrollment";

interface EnrollmentSuccessProps {
  result: EnrollmentResponse;
  onEnrollAnother: () => void;
}

export function EnrollmentSuccess({ result, onEnrollAnother }: EnrollmentSuccessProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const texts = {
    title: isAr ? "تم التسجيل بنجاح!" : "Enrollment Successful!",
    subtitle: isAr ? "تم إنشاء العضوية بنجاح" : "Membership has been created successfully",
    memberName: isAr ? "اسم العضو" : "Member Name",
    plan: isAr ? "الخطة" : "Plan",
    status: isAr ? "الحالة" : "Status",
    total: isAr ? "الإجمالي" : "Total",
    paid: isAr ? "المدفوع" : "Paid",
    period: isAr ? "الفترة" : "Period",
    memberId: isAr ? "رقم العضو" : "Member ID",
    subscriptionId: isAr ? "رقم الاشتراك" : "Subscription ID",
    contractId: isAr ? "رقم العقد" : "Contract ID",
    invoiceId: isAr ? "رقم الفاتورة" : "Invoice ID",
    viewMember: isAr ? "عرض العضو" : "View Member",
    printReceipt: isAr ? "طباعة الإيصال" : "Print Receipt",
    enrollAnother: isAr ? "تسجيل عضو آخر" : "Enroll Another",
    to: isAr ? "إلى" : "to",
  };

  const memberName = isAr
    ? (result.memberName.ar || result.memberName.en)
    : result.memberName.en;

  const planName = isAr
    ? (result.planName.ar || result.planName.en)
    : result.planName.en;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Success header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold">{texts.title}</h2>
        <p className="text-sm text-muted-foreground">{texts.subtitle}</p>
      </div>

      {/* Receipt card */}
      <Card>
        <CardContent className="space-y-3 p-6 text-sm">
          <ReceiptRow label={texts.memberName} value={memberName} />
          <ReceiptRow label={texts.plan} value={planName} />
          <ReceiptRow
            label={texts.period}
            value={`${result.startDate} ${texts.to} ${result.endDate}`}
          />
          <ReceiptRow label={texts.status} value={result.status} />
          <Separator />
          <ReceiptRow
            label={texts.total}
            value={`${result.totalAmount.amount} ${result.totalAmount.currency}`}
            bold
          />
          {result.paidAmount && (
            <ReceiptRow
              label={texts.paid}
              value={`${result.paidAmount.amount} ${result.paidAmount.currency}`}
            />
          )}
          <Separator />
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>{texts.memberId}: {result.memberId}</p>
            <p>{texts.subscriptionId}: {result.subscriptionId}</p>
            {result.contractId && <p>{texts.contractId}: {result.contractId}</p>}
            {result.invoiceId && <p>{texts.invoiceId}: {result.invoiceId}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1">
          <Link href={`/${locale}/members/${result.memberId}`}>
            <User className="me-2 h-4 w-4" />
            {texts.viewMember}
          </Link>
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => window.print()}>
          <Printer className="me-2 h-4 w-4" />
          {texts.printReceipt}
        </Button>
        <Button variant="outline" className="flex-1" onClick={onEnrollAnother}>
          <UserPlus className="me-2 h-4 w-4" />
          {texts.enrollAnother}
        </Button>
      </div>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 ${bold ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end">{value}</span>
    </div>
  );
}
