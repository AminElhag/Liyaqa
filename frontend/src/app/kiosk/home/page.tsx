"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKiosk } from "../layout";
import { TouchButton } from "@/components/kiosk";
import {
  UserCheck,
  Calendar,
  CreditCard,
  Eye,
  FileSignature,
  UserCog,
  LogOut,
} from "lucide-react";
import { useKioskSession } from "@/queries/use-kiosk";

export default function KioskHomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" /></div>}>
      <KioskHomeContent />
    </Suspense>
  );
}

function KioskHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceCode = searchParams.get("device") || "";
  const sessionId = searchParams.get("session") || "";

  const { device, isArabic, endCurrentSession } = useKiosk();
  const { data: session } = useKioskSession(sessionId);

  const allowedActions = device?.allowedActions || [];

  const isActionAllowed = (action: string) => {
    return allowedActions.includes(action);
  };

  const handleCheckIn = () => {
    router.push(`/kiosk/check-in?device=${deviceCode}&session=${sessionId}`);
  };

  const handleClasses = () => {
    router.push(`/kiosk/classes?device=${deviceCode}&session=${sessionId}`);
  };

  const handlePayment = () => {
    router.push(`/kiosk/payment?device=${deviceCode}&session=${sessionId}`);
  };

  const handleMembership = () => {
    // Would show membership details
    alert(isArabic ? "عرض تفاصيل العضوية" : "Show membership details");
  };

  const handleAgreement = () => {
    router.push(`/kiosk/agreement?device=${deviceCode}&session=${sessionId}`);
  };

  const handleProfile = () => {
    // Would show profile update form
    alert(isArabic ? "تحديث الملف الشخصي" : "Update profile");
  };

  const handleExit = () => {
    endCurrentSession();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between bg-white/50">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {session?.memberId?.substring(0, 1).toUpperCase() || "M"}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {isArabic ? "مرحباً!" : "Welcome!"}
            </h1>
            <p className="text-sm text-gray-500">
              {isArabic ? "ماذا تريد أن تفعل اليوم؟" : "What would you like to do today?"}
            </p>
          </div>
        </div>

        <TouchButton
          icon={LogOut}
          label={isArabic ? "خروج" : "Exit"}
          variant="outline"
          size="sm"
          isArabic={isArabic}
          onClick={handleExit}
          className="w-auto px-6"
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {isActionAllowed("CHECK_IN") && (
            <TouchButton
              icon={UserCheck}
              label="Check In"
              labelAr="تسجيل الدخول"
              description="Record your visit"
              descriptionAr="سجل حضورك"
              variant="success"
              size="lg"
              isArabic={isArabic}
              onClick={handleCheckIn}
            />
          )}

          {isActionAllowed("CLASS_BOOKING") && (
            <TouchButton
              icon={Calendar}
              label="Book Class"
              labelAr="حجز حصة"
              description="View & book classes"
              descriptionAr="عرض وحجز الحصص"
              variant="primary"
              size="lg"
              isArabic={isArabic}
              onClick={handleClasses}
            />
          )}

          {isActionAllowed("PAYMENT") && (
            <TouchButton
              icon={CreditCard}
              label="Payment"
              labelAr="الدفع"
              description="Pay invoices"
              descriptionAr="دفع الفواتير"
              variant="primary"
              size="lg"
              isArabic={isArabic}
              onClick={handlePayment}
            />
          )}

          {isActionAllowed("MEMBERSHIP_VIEW") && (
            <TouchButton
              icon={Eye}
              label="My Membership"
              labelAr="عضويتي"
              description="View details"
              descriptionAr="عرض التفاصيل"
              variant="outline"
              size="lg"
              isArabic={isArabic}
              onClick={handleMembership}
            />
          )}

          {isActionAllowed("AGREEMENT_SIGN") && (
            <TouchButton
              icon={FileSignature}
              label="Sign Agreement"
              labelAr="توقيع الاتفاقية"
              description="Sign documents"
              descriptionAr="توقيع المستندات"
              variant="outline"
              size="lg"
              isArabic={isArabic}
              onClick={handleAgreement}
            />
          )}

          {isActionAllowed("PROFILE_UPDATE") && (
            <TouchButton
              icon={UserCog}
              label="Update Profile"
              labelAr="تحديث الملف"
              description="Edit your info"
              descriptionAr="تعديل بياناتك"
              variant="outline"
              size="lg"
              isArabic={isArabic}
              onClick={handleProfile}
            />
          )}
        </div>
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
