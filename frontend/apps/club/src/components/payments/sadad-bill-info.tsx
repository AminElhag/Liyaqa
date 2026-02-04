"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@liyaqa/shared/components/ui/alert";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy,
  RefreshCw,
  FileText,
  Building,
} from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import { saudiPaymentTexts, type SadadBillResponse } from "@liyaqa/shared/types/saudi-payments";
import {
  useGenerateSadadBill,
  useSadadBillStatus,
  useCancelSadadBill,
} from "@liyaqa/shared/queries/use-saudi-payments";
import { useToast } from "@liyaqa/shared/hooks/use-toast";

interface SadadBillInfoProps {
  invoiceId: string;
  amount: number;
  currency?: string;
  existingBillNumber?: string;
  onPaymentReceived?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export function SadadBillInfo({
  invoiceId,
  amount,
  currency = "SAR",
  existingBillNumber,
  onPaymentReceived,
  onError,
  className,
}: SadadBillInfoProps) {
  const locale = useLocale();
  const texts = saudiPaymentTexts[locale as "en" | "ar"];
  const isRtl = locale === "ar";
  const { toast } = useToast();

  const [billData, setBillData] = useState<SadadBillResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateMutation = useGenerateSadadBill();
  const cancelMutation = useCancelSadadBill();
  const { data: billStatus, refetch: refetchStatus } = useSadadBillStatus(
    billData?.billNumber || existingBillNumber || "",
    !!(billData?.billNumber || existingBillNumber)
  );

  // Check if payment was received
  useEffect(() => {
    if (billStatus?.status === "PAID") {
      onPaymentReceived?.();
    }
  }, [billStatus?.status, onPaymentReceived]);

  const handleGenerateBill = async () => {
    setError(null);
    try {
      const result = await generateMutation.mutateAsync(invoiceId);
      if (result.success) {
        setBillData(result);
      } else {
        const errorMessage = locale === "ar" ? result.messageAr : result.messageEn;
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : texts.common.error;
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleCancelBill = async () => {
    setError(null);
    try {
      const result = await cancelMutation.mutateAsync(invoiceId);
      if (result.success) {
        setBillData(null);
        toast({
          title: locale === "ar" ? result.messageAr : result.messageEn,
        });
      } else {
        const errorMessage = locale === "ar" ? result.messageAr : result.messageEn;
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : texts.common.error;
      setError(errorMessage);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: locale === "ar" ? "تم النسخ" : "Copied",
      description: `${label}: ${text}`,
    });
  };

  const formatAmount = (value: number) => {
    return value.toLocaleString(locale === "ar" ? "ar-SA" : "en-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // If bill status is PAID, show success state
  if (billStatus?.status === "PAID") {
    return (
      <Card className={cn("border-green-200 bg-green-50", className)}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">
                {texts.sadad.paymentReceived}
              </h3>
              <p className="text-sm text-green-600 mt-1">
                {formatAmount(billStatus.paidAmount || amount)} {currency}
              </p>
              {billStatus.paymentReference && (
                <p className="text-xs text-green-500 mt-2">
                  Ref: {billStatus.paymentReference}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no bill generated yet
  if (!billData && !existingBillNumber) {
    return (
      <Card className={className}>
        <CardHeader className={cn(isRtl && "text-right")}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#00529B] flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>{texts.sadad.name}</CardTitle>
              <CardDescription>{texts.sadad.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{texts.common.error}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className={cn("text-center py-4", isRtl && "text-right")}>
            <p className="text-muted-foreground mb-4">
              {locale === "ar"
                ? "اضغط على الزر أدناه لإنشاء فاتورة سداد يمكنك دفعها من أي بنك سعودي"
                : "Click below to generate a SADAD bill you can pay from any Saudi bank"}
            </p>
            <Button
              onClick={handleGenerateBill}
              disabled={generateMutation.isPending}
              className="bg-[#00529B] hover:bg-[#004080]"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="mx-2">{texts.common.processing}</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mx-2" />
                  {texts.sadad.generateBill}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Bill has been generated
  const billNumber = billData?.billNumber || existingBillNumber;
  const billerCode = billData?.billerCode || "";
  const instructions =
    locale === "ar" ? billData?.instructionsAr : billData?.instructionsEn;

  return (
    <Card className={cn("border-[#00529B]/30", className)}>
      <CardHeader className={cn(isRtl && "text-right")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#00529B] flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>{texts.sadad.billGenerated}</CardTitle>
              <CardDescription>{texts.sadad.description}</CardDescription>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              billStatus?.status === "PENDING"
                ? "bg-amber-100 text-amber-700"
                : billStatus?.status === "EXPIRED"
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-700"
            )}
          >
            {locale === "ar" ? billStatus?.statusAr : billStatus?.statusEn}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{texts.common.error}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Bill Details */}
        <div className="space-y-3 rounded-lg bg-slate-50 p-4">
          <BillDetailRow
            label={texts.sadad.billerCode}
            value={billerCode}
            onCopy={() => copyToClipboard(billerCode, texts.sadad.billerCode)}
            isRtl={isRtl}
          />
          <Separator />
          <BillDetailRow
            label={texts.sadad.billNumber}
            value={billNumber || ""}
            onCopy={() => copyToClipboard(billNumber || "", texts.sadad.billNumber)}
            isRtl={isRtl}
            highlight
          />
          <Separator />
          <BillDetailRow
            label={texts.sadad.amount}
            value={`${formatAmount(billData?.amount || amount)} ${currency}`}
            isRtl={isRtl}
          />
          {billData?.dueDate && (
            <>
              <Separator />
              <BillDetailRow
                label={texts.sadad.dueDate}
                value={new Date(billData.dueDate).toLocaleDateString(
                  locale === "ar" ? "ar-SA" : "en-SA"
                )}
                isRtl={isRtl}
              />
            </>
          )}
        </div>

        {/* Instructions */}
        {instructions && (
          <div className={cn("space-y-2", isRtl && "text-right")}>
            <h4 className="font-medium text-sm">{texts.sadad.instructions}</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-line bg-blue-50 rounded-lg p-3 border border-blue-100">
              {instructions}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => refetchStatus()}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mx-2" />
            {texts.sadad.checkStatus}
          </Button>
          <Button
            variant="ghost"
            onClick={handleCancelBill}
            disabled={cancelMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {cancelMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              texts.sadad.cancelBill
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface BillDetailRowProps {
  label: string;
  value: string;
  onCopy?: () => void;
  isRtl: boolean;
  highlight?: boolean;
}

function BillDetailRow({
  label,
  value,
  onCopy,
  isRtl,
  highlight,
}: BillDetailRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        isRtl && "flex-row-reverse"
      )}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
        <span
          className={cn(
            "font-mono",
            highlight ? "text-lg font-bold text-[#00529B]" : "text-sm font-medium"
          )}
        >
          {value}
        </span>
        {onCopy && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
            className="h-8 w-8 p-0 hover:bg-slate-200"
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
