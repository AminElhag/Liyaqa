"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKiosk } from "../layout";
import { TouchButton } from "@/components/kiosk";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle,
  AlertCircle,
  Receipt,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateTransaction, useCompleteTransaction } from "@/queries/use-kiosk";

// Mock invoices - in real app, fetch from API
const mockInvoices = [
  {
    id: "inv-001",
    description: "Monthly Membership - January",
    descriptionAr: "اشتراك شهري - يناير",
    amount: 299,
    dueDate: "2026-01-31",
    status: "UNPAID",
  },
  {
    id: "inv-002",
    description: "Personal Training Session x5",
    descriptionAr: "جلسات تدريب شخصي ×5",
    amount: 500,
    dueDate: "2026-02-15",
    status: "UNPAID",
  },
];

type PaymentMethodType = "CARD" | "APPLE_PAY" | "MADA" | "WALLET";

export default function KioskPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" /></div>}>
      <KioskPaymentContent />
    </Suspense>
  );
}

function KioskPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceCode = searchParams.get("device") || "";
  const sessionId = searchParams.get("session") || "";

  const { isArabic } = useKiosk();
  const createTransactionMutation = useCreateTransaction();
  const completeTransactionMutation = useCompleteTransaction();

  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType | null>(null);
  const [status, setStatus] = useState<"select" | "method" | "processing" | "success" | "error">("select");
  const [error, setError] = useState<string | null>(null);

  const paymentMethods: { id: PaymentMethodType; label: string; labelAr: string; icon: typeof CreditCard }[] = [
    { id: "CARD", label: "Credit/Debit Card", labelAr: "بطاقة ائتمان/خصم", icon: CreditCard },
    { id: "APPLE_PAY", label: "Apple Pay", labelAr: "Apple Pay", icon: Smartphone },
    { id: "MADA", label: "Mada", labelAr: "مدى", icon: CreditCard },
    { id: "WALLET", label: "Wallet Balance", labelAr: "رصيد المحفظة", icon: Wallet },
  ];

  const selectedInvoiceData = mockInvoices.find((inv) => inv.id === selectedInvoice);

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoice(invoiceId);
    setStatus("method");
  };

  const handleSelectMethod = (method: PaymentMethodType) => {
    setSelectedMethod(method);
  };

  const handlePay = async () => {
    if (!selectedInvoice || !selectedMethod || !sessionId) return;

    setStatus("processing");
    setError(null);

    try {
      // Create transaction
      const transaction = await createTransactionMutation.mutateAsync({
        sessionId,
        data: {
          transactionType: "PAYMENT",
          referenceType: "INVOICE",
          referenceId: selectedInvoice,
          amount: selectedInvoiceData?.amount,
          paymentMethod: selectedMethod,
        },
      });

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Complete transaction
      await completeTransactionMutation.mutateAsync({
        id: transaction.id,
        data: {
          paymentReference: `PAY-${Date.now()}`,
        },
      });

      setStatus("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : null;
      setError(message || (isArabic ? "فشل في الدفع" : "Payment failed"));
      setStatus("error");
    }
  };

  const handleBack = () => {
    if (status === "method") {
      setStatus("select");
      setSelectedInvoice(null);
      setSelectedMethod(null);
    } else {
      router.push(`/kiosk/home?device=${deviceCode}&session=${sessionId}`);
    }
  };

  const handleHome = () => {
    router.push(`/kiosk/home?device=${deviceCode}&session=${sessionId}`);
  };

  const handleReceipt = () => {
    router.push(`/kiosk/receipt?device=${deviceCode}&session=${sessionId}`);
  };

  // Processing State
  if (status === "processing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-primary border-t-transparent mb-8" />
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          {isArabic ? "جاري معالجة الدفع..." : "Processing payment..."}
        </h2>
        <p className="text-xl text-gray-600">
          {isArabic ? "يرجى عدم إزالة البطاقة" : "Please do not remove your card"}
        </p>
      </div>
    );
  }

  // Success State
  if (status === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-8">
          <CheckCircle className="h-20 w-20 text-green-600" />
        </div>

        <h2 className="text-4xl font-bold text-green-700 mb-4">
          {isArabic ? "تم الدفع بنجاح!" : "Payment Successful!"}
        </h2>

        {selectedInvoiceData && (
          <div className="text-center mb-8">
            <p className="text-2xl text-gray-800 font-semibold">
              {selectedInvoiceData.amount.toFixed(2)} SAR
            </p>
            <p className="text-lg text-gray-600">
              {isArabic ? selectedInvoiceData.descriptionAr : selectedInvoiceData.description}
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <TouchButton
            icon={Receipt}
            label={isArabic ? "طباعة الإيصال" : "Print Receipt"}
            variant="outline"
            size="md"
            isArabic={isArabic}
            onClick={handleReceipt}
          />
          <TouchButton
            icon={Home}
            label={isArabic ? "الرئيسية" : "Home"}
            variant="primary"
            size="md"
            isArabic={isArabic}
            onClick={handleHome}
          />
        </div>
      </div>
    );
  }

  // Error State
  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mb-8">
          <AlertCircle className="h-20 w-20 text-red-600" />
        </div>

        <h2 className="text-4xl font-bold text-red-700 mb-4">
          {isArabic ? "فشل الدفع" : "Payment Failed"}
        </h2>

        <p className="text-2xl text-gray-600 mb-8">{error}</p>

        <div className="flex gap-4">
          <TouchButton
            label={isArabic ? "حاول مرة أخرى" : "Try Again"}
            variant="primary"
            size="md"
            isArabic={isArabic}
            onClick={() => setStatus("method")}
          />
          <TouchButton
            label={isArabic ? "إلغاء" : "Cancel"}
            variant="outline"
            size="md"
            isArabic={isArabic}
            onClick={handleHome}
          />
        </div>
      </div>
    );
  }

  // Payment Method Selection
  if (status === "method" && selectedInvoiceData) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="p-6 flex items-center gap-4">
          <TouchButton
            icon={ArrowLeft}
            label={isArabic ? "رجوع" : "Back"}
            variant="outline"
            size="sm"
            isArabic={isArabic}
            onClick={handleBack}
            className="w-auto px-6"
          />
          <h1 className="text-2xl font-bold text-gray-800">
            {isArabic ? "اختر طريقة الدفع" : "Select Payment Method"}
          </h1>
        </header>

        <main className="flex-1 p-8 max-w-2xl mx-auto w-full">
          {/* Invoice Summary */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-lg text-gray-600 mb-2">
              {isArabic ? "ملخص الدفع" : "Payment Summary"}
            </h3>
            <p className="text-xl font-medium text-gray-800 mb-1">
              {isArabic ? selectedInvoiceData.descriptionAr : selectedInvoiceData.description}
            </p>
            <p className="text-4xl font-bold text-primary">
              {selectedInvoiceData.amount.toFixed(2)} <span className="text-lg">SAR</span>
            </p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4 mb-8">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => handleSelectMethod(method.id)}
                  className={cn(
                    "w-full p-6 rounded-2xl flex items-center gap-4",
                    "transition-all touch-manipulation",
                    selectedMethod === method.id
                      ? "bg-primary text-white shadow-lg"
                      : "bg-white shadow hover:shadow-md"
                  )}
                >
                  <Icon className="h-10 w-10" />
                  <span className="text-2xl font-medium">
                    {isArabic ? method.labelAr : method.label}
                  </span>
                  {selectedMethod === method.id && (
                    <CheckCircle className="h-8 w-8 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Pay Button */}
          <TouchButton
            icon={CreditCard}
            label={isArabic ? `ادفع ${selectedInvoiceData.amount} ريال` : `Pay ${selectedInvoiceData.amount} SAR`}
            variant="success"
            size="lg"
            isArabic={isArabic}
            onClick={handlePay}
            disabled={!selectedMethod}
            className="w-full"
          />
        </main>
      </div>
    );
  }

  // Invoice Selection
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-6 flex items-center gap-4">
        <TouchButton
          icon={ArrowLeft}
          label={isArabic ? "رجوع" : "Back"}
          variant="outline"
          size="sm"
          isArabic={isArabic}
          onClick={handleBack}
          className="w-auto px-6"
        />
        <h1 className="text-2xl font-bold text-gray-800">
          {isArabic ? "الدفع" : "Payment"}
        </h1>
      </header>

      <main className="flex-1 p-8 max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {isArabic ? "اختر فاتورة للدفع" : "Select an invoice to pay"}
        </h2>

        {mockInvoices.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl text-gray-600">
              {isArabic ? "لا توجد فواتير مستحقة" : "No outstanding invoices"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {mockInvoices.map((invoice) => (
              <button
                key={invoice.id}
                onClick={() => handleSelectInvoice(invoice.id)}
                className={cn(
                  "w-full p-6 rounded-2xl bg-white shadow-md",
                  "hover:shadow-lg active:scale-[0.99] transition-all",
                  "text-left touch-manipulation"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {isArabic ? invoice.descriptionAr : invoice.description}
                  </h3>
                  <span className="text-2xl font-bold text-primary">
                    {invoice.amount} <span className="text-sm">SAR</span>
                  </span>
                </div>
                <p className="text-gray-500">
                  {isArabic ? "تاريخ الاستحقاق:" : "Due:"} {invoice.dueDate}
                </p>
              </button>
            ))}
          </div>
        )}
      </main>

      <footer className="p-6 text-center text-gray-500">
        <p>
          {isArabic
            ? "هل تحتاج مساعدة؟ تحدث إلى موظف الاستقبال"
            : "Need help? Speak to a staff member"}
        </p>
      </footer>
    </div>
  );
}
