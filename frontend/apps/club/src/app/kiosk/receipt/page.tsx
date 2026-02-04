"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKiosk } from "../layout";
import { TouchButton } from "@/components/kiosk";
import {
  Printer,
  Mail,
  MessageSquare,
  CheckCircle,
  Home,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@liyaqa/shared/utils";

export default function KioskReceiptPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" /></div>}>
      <KioskReceiptContent />
    </Suspense>
  );
}

function KioskReceiptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceCode = searchParams.get("device") || "";
  const sessionId = searchParams.get("session") || "";

  const { device, isArabic } = useKiosk();

  const [printStatus, setPrintStatus] = useState<"idle" | "printing" | "done">("idle");
  const [emailSent, setEmailSent] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const handlePrint = async () => {
    setPrintStatus("printing");
    // Simulate printing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setPrintStatus("done");
  };

  const handleEmail = async () => {
    // Simulate sending email
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setEmailSent(true);
  };

  const handleSms = async () => {
    // Simulate sending SMS
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSmsSent(true);
  };

  const handleBack = () => {
    router.push(`/kiosk/home?device=${deviceCode}&session=${sessionId}`);
  };

  const canPrint = device?.allowedActions?.includes("RECEIPT_PRINT");

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
          {isArabic ? "الإيصال" : "Receipt"}
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {isArabic ? "كيف تريد استلام الإيصال؟" : "How would you like your receipt?"}
          </h2>
          <p className="text-xl text-gray-600">
            {isArabic
              ? "اختر واحدة أو أكثر من الخيارات أدناه"
              : "Choose one or more options below"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
          {/* Print Option */}
          {canPrint && (
            <button
              onClick={handlePrint}
              disabled={printStatus === "printing"}
              className={cn(
                "p-8 rounded-2xl flex flex-col items-center gap-4",
                "transition-all touch-manipulation",
                printStatus === "done"
                  ? "bg-green-100 border-2 border-green-500"
                  : "bg-white shadow-lg hover:shadow-xl active:scale-[0.98]"
              )}
            >
              {printStatus === "done" ? (
                <CheckCircle className="h-16 w-16 text-green-600" />
              ) : printStatus === "printing" ? (
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
              ) : (
                <Printer className="h-16 w-16 text-primary" />
              )}
              <span className="text-xl font-semibold text-gray-800">
                {printStatus === "done"
                  ? isArabic ? "تم الطباعة" : "Printed"
                  : printStatus === "printing"
                  ? isArabic ? "جاري الطباعة..." : "Printing..."
                  : isArabic ? "طباعة" : "Print"}
              </span>
            </button>
          )}

          {/* Email Option */}
          <button
            onClick={handleEmail}
            disabled={emailSent}
            className={cn(
              "p-8 rounded-2xl flex flex-col items-center gap-4",
              "transition-all touch-manipulation",
              emailSent
                ? "bg-green-100 border-2 border-green-500"
                : "bg-white shadow-lg hover:shadow-xl active:scale-[0.98]"
            )}
          >
            {emailSent ? (
              <CheckCircle className="h-16 w-16 text-green-600" />
            ) : (
              <Mail className="h-16 w-16 text-primary" />
            )}
            <span className="text-xl font-semibold text-gray-800">
              {emailSent
                ? isArabic ? "تم الإرسال" : "Sent"
                : isArabic ? "بريد إلكتروني" : "Email"}
            </span>
            {emailSent && (
              <span className="text-sm text-green-600">
                {isArabic ? "تم إرسال الإيصال" : "Receipt sent"}
              </span>
            )}
          </button>

          {/* SMS Option */}
          <button
            onClick={handleSms}
            disabled={smsSent}
            className={cn(
              "p-8 rounded-2xl flex flex-col items-center gap-4",
              "transition-all touch-manipulation",
              smsSent
                ? "bg-green-100 border-2 border-green-500"
                : "bg-white shadow-lg hover:shadow-xl active:scale-[0.98]"
            )}
          >
            {smsSent ? (
              <CheckCircle className="h-16 w-16 text-green-600" />
            ) : (
              <MessageSquare className="h-16 w-16 text-primary" />
            )}
            <span className="text-xl font-semibold text-gray-800">
              {smsSent
                ? isArabic ? "تم الإرسال" : "Sent"
                : isArabic ? "رسالة نصية" : "SMS"}
            </span>
            {smsSent && (
              <span className="text-sm text-green-600">
                {isArabic ? "تم إرسال الإيصال" : "Receipt sent"}
              </span>
            )}
          </button>
        </div>

        {/* Done Button */}
        <div className="mt-12">
          <TouchButton
            icon={Home}
            label={isArabic ? "انتهيت" : "I'm Done"}
            variant="primary"
            size="lg"
            isArabic={isArabic}
            onClick={handleBack}
          />
        </div>
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
