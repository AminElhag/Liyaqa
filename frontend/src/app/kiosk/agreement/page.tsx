"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKiosk } from "../layout";
import { TouchButton, SignaturePad } from "@/components/kiosk";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useCreateSignature, useKioskSession } from "@/queries/use-kiosk";

// Mock agreement data - in real app, fetch from API
const mockAgreement = {
  id: "agreement-001",
  title: "Membership Agreement",
  titleAr: "اتفاقية العضوية",
  content: `
MEMBERSHIP AGREEMENT TERMS AND CONDITIONS

1. MEMBERSHIP RULES
Members agree to follow all gym rules and regulations. Proper gym attire is required at all times.
Members must bring a towel for equipment use.

2. PAYMENT TERMS
Membership fees are due on the 1st of each month. Late payments may result in access suspension.
No refunds will be provided for unused membership periods.

3. CANCELLATION POLICY
Members may cancel their membership with 30 days written notice.
Early termination fees may apply for contracts with a fixed term.

4. LIABILITY WAIVER
The gym is not responsible for personal injuries that occur during exercise activities.
Members should consult a physician before starting any exercise program.

5. FACILITY ACCESS
Access hours are from 6:00 AM to 11:00 PM daily. Holiday hours may vary.
Children under 16 must be accompanied by an adult member.

By signing below, I acknowledge that I have read, understood, and agree to these terms.
  `.trim(),
  contentAr: `
اتفاقية العضوية - الشروط والأحكام

1. قواعد العضوية
يوافق الأعضاء على اتباع جميع قواعد وأنظمة النادي. يجب ارتداء الملابس الرياضية المناسبة في جميع الأوقات.
يجب على الأعضاء إحضار منشفة لاستخدام المعدات.

2. شروط الدفع
رسوم العضوية مستحقة في الأول من كل شهر. قد يؤدي التأخر في السداد إلى تعليق الدخول.
لن يتم تقديم أي استرداد لفترات العضوية غير المستخدمة.

3. سياسة الإلغاء
يمكن للأعضاء إلغاء عضويتهم بإشعار كتابي قبل 30 يومًا.
قد يتم تطبيق رسوم إنهاء مبكر للعقود ذات المدة المحددة.

4. إخلاء المسؤولية
النادي غير مسؤول عن الإصابات الشخصية التي تحدث أثناء الأنشطة الرياضية.
يجب على الأعضاء استشارة الطبيب قبل البدء في أي برنامج تمارين.

5. الوصول إلى المرافق
ساعات الدخول من 6:00 صباحًا حتى 11:00 مساءً يوميًا. قد تختلف ساعات العمل في العطلات.
يجب أن يكون الأطفال دون 16 عامًا برفقة عضو بالغ.

بالتوقيع أدناه، أقر بأنني قرأت وفهمت ووافقت على هذه الشروط.
  `.trim(),
};

export default function KioskAgreementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceCode = searchParams.get("device") || "";
  const sessionId = searchParams.get("session") || "";

  const { isArabic } = useKiosk();
  const { data: session } = useKioskSession(sessionId);
  const createSignatureMutation = useCreateSignature();

  const [status, setStatus] = useState<"view" | "sign" | "processing" | "success" | "error">("view");
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleProceedToSign = () => {
    setStatus("sign");
  };

  const handleSignature = async (signatureData: string) => {
    if (!sessionId || !session?.memberId) return;

    setStatus("processing");
    setError(null);

    try {
      await createSignatureMutation.mutateAsync({
        sessionId,
        data: {
          memberId: session.memberId,
          agreementId: mockAgreement.id,
          signatureData,
        },
      });
      setStatus("success");
    } catch (err: any) {
      setError(
        err?.message ||
          (isArabic ? "فشل في حفظ التوقيع" : "Failed to save signature")
      );
      setStatus("error");
    }
  };

  const handleBack = () => {
    if (status === "sign") {
      setStatus("view");
    } else {
      router.push(`/kiosk/home?device=${deviceCode}&session=${sessionId}`);
    }
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
          {isArabic ? "جاري حفظ التوقيع..." : "Saving signature..."}
        </h2>
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
          {isArabic ? "تم توقيع الاتفاقية!" : "Agreement Signed!"}
        </h2>

        <p className="text-2xl text-gray-600 mb-8">
          {isArabic ? "شكراً لك" : "Thank you"}
        </p>

        <TouchButton
          label={isArabic ? "العودة للرئيسية" : "Back to Home"}
          variant="primary"
          size="lg"
          isArabic={isArabic}
          onClick={handleHome}
        />
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
          {isArabic ? "فشل في التوقيع" : "Signature Failed"}
        </h2>

        <p className="text-2xl text-gray-600 mb-8">{error}</p>

        <div className="flex gap-4">
          <TouchButton
            label={isArabic ? "حاول مرة أخرى" : "Try Again"}
            variant="primary"
            size="md"
            isArabic={isArabic}
            onClick={() => setStatus("sign")}
          />
          <TouchButton
            label={isArabic ? "العودة" : "Go Back"}
            variant="outline"
            size="md"
            isArabic={isArabic}
            onClick={handleHome}
          />
        </div>
      </div>
    );
  }

  // Signature Pad State
  if (status === "sign") {
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
            {isArabic ? "التوقيع الإلكتروني" : "Electronic Signature"}
          </h1>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {isArabic ? "وقع أدناه" : "Sign Below"}
            </h2>
            <p className="text-xl text-gray-600">
              {isArabic
                ? "استخدم إصبعك للتوقيع على الشاشة"
                : "Use your finger to sign on the screen"}
            </p>
          </div>

          <SignaturePad
            onSubmit={handleSignature}
            width={600}
            height={250}
            isArabic={isArabic}
          />
        </main>
      </div>
    );
  }

  // View Agreement State
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
          {isArabic ? "توقيع الاتفاقية" : "Sign Agreement"}
        </h1>
      </header>

      <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
        {/* Agreement Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 bg-primary/5 border-b flex items-center gap-4">
            <FileText className="h-10 w-10 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {isArabic ? mockAgreement.titleAr : mockAgreement.title}
              </h2>
              <p className="text-gray-600">
                {isArabic ? "يرجى قراءة الاتفاقية قبل التوقيع" : "Please read the agreement before signing"}
              </p>
            </div>
          </div>

          <div className="p-6">
            <div
              className={`prose prose-lg max-w-none ${
                isExpanded ? "" : "max-h-[400px] overflow-hidden relative"
              }`}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {isArabic ? mockAgreement.contentAr : mockAgreement.content}

              {!isExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
              )}
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-4 w-full py-3 flex items-center justify-center gap-2 text-primary hover:bg-primary/5 rounded-xl transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-5 w-5" />
                  {isArabic ? "عرض أقل" : "Show Less"}
                </>
              ) : (
                <>
                  <ChevronDown className="h-5 w-5" />
                  {isArabic ? "عرض المزيد" : "Show More"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sign Button */}
        <div className="text-center">
          <TouchButton
            icon={FileText}
            label={isArabic ? "أوافق وأوقع" : "I Agree & Sign"}
            variant="success"
            size="lg"
            isArabic={isArabic}
            onClick={handleProceedToSign}
            className="min-w-[300px]"
          />
        </div>
      </main>
    </div>
  );
}
