"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKiosk } from "../layout";
import { NumericKeypad, QRScanner, TouchButton } from "@/components/kiosk";
import { ArrowLeft, Phone, CreditCard, User, CheckCircle, AlertCircle } from "lucide-react";
import { useIdentifyMember } from "@/queries/use-kiosk";
import type { IdentificationMethod } from "@/types/kiosk";

export default function KioskIdentifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceCode = searchParams.get("device") || "";
  const method = searchParams.get("method") || "phone";
  const sessionId = searchParams.get("session") || "";

  const { isArabic, endCurrentSession } = useKiosk();
  const identifyMutation = useIdentifyMember();

  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const getMethodLabel = () => {
    switch (method) {
      case "qr":
        return isArabic ? "مسح رمز QR" : "Scan QR Code";
      case "phone":
        return isArabic ? "أدخل رقم هاتفك" : "Enter Phone Number";
      case "card":
        return isArabic ? "ضع بطاقتك" : "Tap Your Card";
      case "member_id":
        return isArabic ? "أدخل رقم عضويتك" : "Enter Member ID";
      default:
        return "";
    }
  };

  const getIdentificationMethod = (): IdentificationMethod => {
    switch (method) {
      case "qr":
        return "QR_CODE";
      case "phone":
        return "PHONE";
      case "card":
        return "CARD";
      case "member_id":
        return "MEMBER_ID";
      default:
        return "PHONE";
    }
  };

  const handleIdentify = async (value: string) => {
    if (!sessionId || !value) return;

    setError(null);
    setIsProcessing(true);

    try {
      const updatedSession = await identifyMutation.mutateAsync({
        sessionId,
        data: {
          method: getIdentificationMethod(),
          value: value,
        },
      });

      if (updatedSession.memberId) {
        // Successfully identified - navigate to home
        router.push(`/kiosk/home?device=${deviceCode}&session=${sessionId}`);
      } else {
        setError(isArabic ? "لم يتم العثور على العضو" : "Member not found");
      }
    } catch (err) {
      setError(isArabic ? "فشل في التعريف. يرجى المحاولة مرة أخرى." : "Identification failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQRScan = (data: string) => {
    handleIdentify(data);
  };

  const handleKeypadSubmit = () => {
    if (inputValue.length >= 4) {
      handleIdentify(inputValue);
    }
  };

  const handleBack = () => {
    endCurrentSession();
  };

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
        <h1 className="text-2xl font-bold text-gray-800">{getMethodLabel()}</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-100 rounded-xl flex items-center gap-3 text-red-700 max-w-md w-full">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <p className="text-lg">{error}</p>
          </div>
        )}

        {/* Processing State */}
        {isProcessing ? (
          <div className="text-center space-y-6">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-2xl text-gray-600">
              {isArabic ? "جاري التحقق..." : "Verifying..."}
            </p>
          </div>
        ) : (
          <>
            {/* QR Scanner */}
            {method === "qr" && (
              <div className="w-full max-w-lg">
                <QRScanner
                  onScan={handleQRScan}
                  isArabic={isArabic}
                />
              </div>
            )}

            {/* Phone Number Input */}
            {method === "phone" && (
              <div className="w-full max-w-md">
                <div className="mb-6 text-center">
                  <Phone className="h-16 w-16 mx-auto text-primary mb-4" />
                  <p className="text-xl text-gray-600">
                    {isArabic
                      ? "أدخل رقم هاتفك المسجل"
                      : "Enter your registered phone number"}
                  </p>
                </div>
                <NumericKeypad
                  value={inputValue}
                  onChange={setInputValue}
                  onSubmit={handleKeypadSubmit}
                  maxLength={15}
                  submitLabel={isArabic ? "تأكيد" : "Confirm"}
                  isArabic={isArabic}
                />
              </div>
            )}

            {/* Card Scan */}
            {method === "card" && (
              <div className="text-center space-y-8 max-w-md">
                <CreditCard className="h-32 w-32 mx-auto text-primary animate-pulse" />
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    {isArabic ? "ضع بطاقتك" : "Tap Your Card"}
                  </h2>
                  <p className="text-xl text-gray-600">
                    {isArabic
                      ? "ضع بطاقة العضوية على القارئ"
                      : "Place your member card on the reader"}
                  </p>
                </div>
                {/* Simulated card read button for demo */}
                <button
                  onClick={() => handleIdentify("CARD-" + Math.random().toString(36).substring(2, 8).toUpperCase())}
                  className="px-8 py-4 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300 transition-all"
                >
                  {isArabic ? "محاكاة قراءة البطاقة" : "Simulate Card Read"}
                </button>
              </div>
            )}

            {/* Member ID Input */}
            {method === "member_id" && (
              <div className="w-full max-w-md">
                <div className="mb-6 text-center">
                  <User className="h-16 w-16 mx-auto text-primary mb-4" />
                  <p className="text-xl text-gray-600">
                    {isArabic
                      ? "أدخل رقم العضوية الخاص بك"
                      : "Enter your member ID number"}
                  </p>
                </div>
                <NumericKeypad
                  value={inputValue}
                  onChange={setInputValue}
                  onSubmit={handleKeypadSubmit}
                  maxLength={10}
                  submitLabel={isArabic ? "تأكيد" : "Confirm"}
                  isArabic={isArabic}
                />
              </div>
            )}
          </>
        )}
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
