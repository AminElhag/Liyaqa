"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKiosk } from "../layout";
import { TouchButton } from "@/components/kiosk";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@liyaqa/shared/utils";

// Mock classes data - in real app, fetch from API
const mockClasses = [
  {
    id: "1",
    name: "Morning Yoga",
    nameAr: "يوغا صباحية",
    instructor: "Sarah",
    time: "07:00",
    duration: 60,
    capacity: 20,
    booked: 15,
  },
  {
    id: "2",
    name: "HIIT Training",
    nameAr: "تدريب عالي الشدة",
    instructor: "Ahmed",
    time: "09:00",
    duration: 45,
    capacity: 15,
    booked: 15,
  },
  {
    id: "3",
    name: "Spin Class",
    nameAr: "سبين",
    instructor: "Mohammed",
    time: "10:30",
    duration: 50,
    capacity: 25,
    booked: 18,
  },
  {
    id: "4",
    name: "Pilates",
    nameAr: "بيلاتس",
    instructor: "Fatima",
    time: "12:00",
    duration: 55,
    capacity: 18,
    booked: 10,
  },
  {
    id: "5",
    name: "CrossFit",
    nameAr: "كروس فيت",
    instructor: "Khalid",
    time: "16:00",
    duration: 60,
    capacity: 20,
    booked: 12,
  },
  {
    id: "6",
    name: "Zumba",
    nameAr: "زومبا",
    instructor: "Layla",
    time: "18:00",
    duration: 45,
    capacity: 30,
    booked: 28,
  },
];

export default function KioskClassesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" /></div>}>
      <KioskClassesContent />
    </Suspense>
  );
}

function KioskClassesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceCode = searchParams.get("device") || "";
  const sessionId = searchParams.get("session") || "";

  const { isArabic } = useKiosk();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [status, setStatus] = useState<"browse" | "confirm" | "processing" | "success" | "error">("browse");

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleSelectClass = (classId: string) => {
    setSelectedClass(classId);
    setStatus("confirm");
  };

  const handleConfirmBooking = async () => {
    setStatus("processing");
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setStatus("success");
  };

  const handleBack = () => {
    if (status === "confirm") {
      setStatus("browse");
      setSelectedClass(null);
    } else {
      router.push(`/kiosk/home?device=${deviceCode}&session=${sessionId}`);
    }
  };

  const handleHome = () => {
    router.push(`/kiosk/home?device=${deviceCode}&session=${sessionId}`);
  };

  const selectedClassData = mockClasses.find((c) => c.id === selectedClass);

  // Processing State
  if (status === "processing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-primary border-t-transparent mb-8" />
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          {isArabic ? "جاري الحجز..." : "Booking class..."}
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
          {isArabic ? "تم الحجز بنجاح!" : "Booking Confirmed!"}
        </h2>

        {selectedClassData && (
          <div className="text-center mb-8">
            <p className="text-2xl text-gray-800 font-semibold">
              {isArabic ? selectedClassData.nameAr : selectedClassData.name}
            </p>
            <p className="text-xl text-gray-600">
              {selectedClassData.time} - {formatDate(selectedDate)}
            </p>
          </div>
        )}

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

  // Confirm State
  if (status === "confirm" && selectedClassData) {
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
            {isArabic ? "تأكيد الحجز" : "Confirm Booking"}
          </h1>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-primary" />
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {isArabic ? selectedClassData.nameAr : selectedClassData.name}
            </h2>

            <p className="text-xl text-gray-600 mb-6">
              {isArabic ? "مع المدرب" : "with"} {selectedClassData.instructor}
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-center gap-3 text-lg text-gray-700">
                <Calendar className="h-5 w-5" />
                <span>{formatDate(selectedDate)}</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-lg text-gray-700">
                <Clock className="h-5 w-5" />
                <span>{selectedClassData.time} ({selectedClassData.duration} {isArabic ? "دقيقة" : "min"})</span>
              </div>
            </div>

            <div className="flex gap-4">
              <TouchButton
                label={isArabic ? "إلغاء" : "Cancel"}
                variant="outline"
                size="md"
                isArabic={isArabic}
                onClick={handleBack}
                className="flex-1"
              />
              <TouchButton
                icon={CheckCircle}
                label={isArabic ? "تأكيد" : "Confirm"}
                variant="success"
                size="md"
                isArabic={isArabic}
                onClick={handleConfirmBooking}
                className="flex-1"
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Browse State
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
          {isArabic ? "حجز الحصص" : "Book a Class"}
        </h1>
      </header>

      <main className="flex-1 p-6">
        {/* Date Selector */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => changeDate(-1)}
            className="p-3 rounded-xl bg-white shadow hover:shadow-md transition-all"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <div className="px-8 py-4 bg-white rounded-xl shadow min-w-[300px] text-center">
            <p className="text-2xl font-bold text-gray-800">{formatDate(selectedDate)}</p>
          </div>

          <button
            onClick={() => changeDate(1)}
            className="p-3 rounded-xl bg-white shadow hover:shadow-md transition-all"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {mockClasses.map((cls) => {
            const isFull = cls.booked >= cls.capacity;
            const spotsLeft = cls.capacity - cls.booked;

            return (
              <button
                key={cls.id}
                onClick={() => !isFull && handleSelectClass(cls.id)}
                disabled={isFull}
                className={cn(
                  "p-6 rounded-2xl text-left transition-all",
                  "bg-white shadow-md hover:shadow-lg",
                  isFull
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:scale-[1.02] active:scale-[0.99]"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {isArabic ? cls.nameAr : cls.name}
                    </h3>
                    <p className="text-gray-600">{cls.instructor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{cls.time}</p>
                    <p className="text-sm text-gray-500">{cls.duration} {isArabic ? "د" : "min"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {cls.booked}/{cls.capacity}
                    </span>
                  </div>

                  {isFull ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      {isArabic ? "مكتمل" : "Full"}
                    </span>
                  ) : spotsLeft <= 3 ? (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                      {spotsLeft} {isArabic ? "متبقي" : "left"}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {isArabic ? "متاح" : "Available"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
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
