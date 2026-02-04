"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKiosk } from "../layout";
import { TouchButton } from "@/components/kiosk";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Printer,
  Home,
} from "lucide-react";
import { usePerformCheckIn, useKioskSession, useMarkReceiptPrinted } from "@liyaqa/shared/queries/use-kiosk";

export default function KioskCheckInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" /></div>}>
      <KioskCheckInContent />
    </Suspense>
  );
}

function KioskCheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceCode = searchParams.get("device") || "";
  const sessionId = searchParams.get("session") || "";

  const { device, isArabic } = useKiosk();
  const { data: session } = useKioskSession(sessionId);
  const checkInMutation = usePerformCheckIn();
  const printReceiptMutation = useMarkReceiptPrinted();

  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const handleCheckIn = async () => {
    if (!sessionId || !session?.memberId) return;

    setStatus("processing");
    setError(null);

    try {
      const transaction = await checkInMutation.mutateAsync({
        sessionId,
        data: {
          memberId: session.memberId,
        },
      });
      setTransactionId(transaction.id);
      setStatus("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : null;
      setError(
        message ||
          (isArabic ? "فشل في تسجيل الدخول" : "Check-in failed")
      );
      setStatus("error");
    }
  };

  const handlePrintReceipt = async () => {
    if (!transactionId) return;
    try {
      await printReceiptMutation.mutateAsync(transactionId);
      // In real implementation, would trigger receipt printer
      alert(isArabic ? "تم طباعة الإيصال" : "Receipt printed");
    } catch {
      alert(isArabic ? "فشل في الطباعة" : "Print failed");
    }
  };

  const handleBack = () => {
    router.push(`/kiosk/home?device=${deviceCode}&session=${sessionId}`);
  };

  const handleHome = () => {
    router.push(`/kiosk/home?device=${deviceCode}&session=${sessionId}`);
  };

  // Processing State
  if (status === "processing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-primary border-t-transparent mb-8" />
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          {isArabic ? "جاري تسجيل الدخول..." : "Checking you in..."}
        </h2>
        <p className="text-xl text-gray-600">
          {isArabic ? "يرجى الانتظار" : "Please wait"}
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
          {isArabic ? "تم تسجيل الدخول بنجاح!" : "Check-in Successful!"}
        </h2>

        <p className="text-2xl text-gray-600 mb-8">
          {isArabic ? "استمتع بتمرينك!" : "Enjoy your workout!"}
        </p>

        <div className="text-center mb-12">
          <p className="text-lg text-gray-500">
            {new Date().toLocaleTimeString(isArabic ? "ar-SA" : "en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-lg text-gray-500">
            {new Date().toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="flex gap-4">
          {device?.allowedActions?.includes("RECEIPT_PRINT") && (
            <TouchButton
              icon={Printer}
              label={isArabic ? "طباعة إيصال" : "Print Receipt"}
              variant="outline"
              size="md"
              isArabic={isArabic}
              onClick={handlePrintReceipt}
            />
          )}

          <TouchButton
            icon={Home}
            label={isArabic ? "العودة للرئيسية" : "Back to Home"}
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
          {isArabic ? "فشل تسجيل الدخول" : "Check-in Failed"}
        </h2>

        <p className="text-2xl text-gray-600 mb-8 text-center max-w-md">
          {error}
        </p>

        <div className="flex gap-4">
          <TouchButton
            icon={ArrowLeft}
            label={isArabic ? "حاول مرة أخرى" : "Try Again"}
            variant="primary"
            size="md"
            isArabic={isArabic}
            onClick={() => setStatus("idle")}
          />

          <TouchButton
            icon={Home}
            label={isArabic ? "العودة للرئيسية" : "Back to Home"}
            variant="outline"
            size="md"
            isArabic={isArabic}
            onClick={handleHome}
          />
        </div>
      </div>
    );
  }

  // Idle State - Confirm Check-in
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
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
          {isArabic ? "تسجيل الدخول" : "Check In"}
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-14 w-14 text-primary" />
          </div>

          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            {isArabic ? "تأكيد تسجيل الدخول" : "Confirm Check-in"}
          </h2>

          <p className="text-2xl text-gray-600">
            {isArabic
              ? "اضغط على الزر أدناه لتسجيل حضورك"
              : "Press the button below to record your attendance"}
          </p>
        </div>

        <TouchButton
          icon={CheckCircle}
          label={isArabic ? "تسجيل الدخول الآن" : "Check In Now"}
          variant="success"
          size="xl"
          isArabic={isArabic}
          onClick={handleCheckIn}
          className="min-w-[300px]"
        />
      </main>

      {/* Footer */}
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
