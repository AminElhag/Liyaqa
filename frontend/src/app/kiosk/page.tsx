"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useKiosk } from "./layout";
import { TouchButton } from "@/components/kiosk";
import { Languages, QrCode, Phone, CreditCard, User } from "lucide-react";

export default function KioskWelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceCode = searchParams.get("device") || "";
  const { device, isArabic, setIsArabic, startNewSession } = useKiosk();

  const handleStart = async (method: "qr" | "phone" | "card" | "member_id") => {
    const session = await startNewSession();
    if (session) {
      router.push(`/kiosk/identify?device=${deviceCode}&method=${method}&session=${session.id}`);
    }
  };

  const toggleLanguage = () => {
    setIsArabic(!isArabic);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-3xl font-bold text-white">L</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isArabic ? "ليقى للياقة" : "Liyaqa Fitness"}
            </h1>
            <p className="text-sm text-gray-500">
              {isArabic ? device?.deviceNameAr || device?.deviceName : device?.deviceName}
            </p>
          </div>
        </div>

        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-md hover:shadow-lg transition-all"
        >
          <Languages className="h-5 w-5" />
          <span className="font-medium">{isArabic ? "English" : "عربي"}</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-800 mb-4">
            {isArabic ? "مرحباً بك!" : "Welcome!"}
          </h2>
          <p className="text-2xl text-gray-600">
            {isArabic
              ? "كيف تريد التعريف بنفسك؟"
              : "How would you like to identify yourself?"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 max-w-2xl w-full">
          <TouchButton
            icon={QrCode}
            label="QR Code"
            labelAr="رمز QR"
            description="Scan your member QR"
            descriptionAr="امسح رمز QR الخاص بك"
            variant="primary"
            size="xl"
            isArabic={isArabic}
            onClick={() => handleStart("qr")}
          />

          <TouchButton
            icon={Phone}
            label="Phone Number"
            labelAr="رقم الهاتف"
            description="Enter your phone"
            descriptionAr="أدخل رقم هاتفك"
            variant="primary"
            size="xl"
            isArabic={isArabic}
            onClick={() => handleStart("phone")}
          />

          <TouchButton
            icon={CreditCard}
            label="Member Card"
            labelAr="بطاقة العضوية"
            description="Tap your access card"
            descriptionAr="ضع بطاقة الدخول"
            variant="outline"
            size="xl"
            isArabic={isArabic}
            onClick={() => handleStart("card")}
          />

          <TouchButton
            icon={User}
            label="Member ID"
            labelAr="رقم العضوية"
            description="Enter your ID number"
            descriptionAr="أدخل رقم عضويتك"
            variant="outline"
            size="xl"
            isArabic={isArabic}
            onClick={() => handleStart("member_id")}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-gray-500">
        <p>{isArabic ? "هل تحتاج مساعدة؟ تحدث إلى موظف الاستقبال" : "Need help? Speak to a staff member"}</p>
      </footer>
    </div>
  );
}
