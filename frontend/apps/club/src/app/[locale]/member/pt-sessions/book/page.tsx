"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ArrowLeft, Dumbbell, User, Calendar, Clock, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@liyaqa/shared/components/ui/card";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@liyaqa/shared/components/ui/avatar";
import { TrainerAvailability } from "@/components/member/trainer-availability";
import { useAvailableTrainersForPT } from "@liyaqa/shared/queries/use-trainers";
import { useBookPTSession } from "@liyaqa/shared/queries/use-pt-sessions";
import type { AvailableSlot } from "@liyaqa/shared/types/pt-session";
import { cn, getInitials } from "@liyaqa/shared/utils";

type BookingStep = "trainer" | "slot" | "confirm" | "success";

export default function BookPTSessionPage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  const [step, setStep] = useState<BookingStep>("trainer");
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("");
  const [selectedTrainerName, setSelectedTrainerName] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [notes, setNotes] = useState("");

  const { data: trainersData, isLoading: trainersLoading } = useAvailableTrainersForPT({
    size: 50,
  });

  const bookMutation = useBookPTSession();

  const handleSelectTrainer = (trainerId: string, trainerName: string) => {
    setSelectedTrainerId(trainerId);
    setSelectedTrainerName(trainerName);
    setSelectedSlot(null);
    setStep("slot");
  };

  const handleSelectSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setStep("confirm");
  };

  const handleBook = async () => {
    if (!selectedTrainerId || !selectedSlot) return;

    try {
      await bookMutation.mutateAsync({
        trainerId: selectedTrainerId,
        sessionDate: selectedSlot.date,
        startTime: selectedSlot.startTime,
        notes: notes || undefined,
      });

      setStep("success");
    } catch {
      toast.error(
        isArabic
          ? "فشل في حجز الجلسة"
          : "Failed to book session"
      );
    }
  };

  const handleBack = () => {
    if (step === "slot") {
      setStep("trainer");
      setSelectedTrainerId("");
      setSelectedTrainerName("");
    } else if (step === "confirm") {
      setStep("slot");
      setSelectedSlot(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {step !== "success" && (
          <Link href={`/${locale}/member/pt-sessions`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? "حجز جلسة تدريب" : "Book Training Session"}
          </h1>
          <p className="text-muted-foreground">
            {step === "trainer" &&
              (isArabic ? "اختر المدرب" : "Select your trainer")}
            {step === "slot" &&
              (isArabic ? "اختر الموعد المناسب" : "Select a time slot")}
            {step === "confirm" &&
              (isArabic ? "تأكيد الحجز" : "Confirm booking")}
            {step === "success" &&
              (isArabic ? "تم الحجز بنجاح" : "Booking confirmed")}
          </p>
        </div>
      </div>

      {/* Step: Select Trainer */}
      {step === "trainer" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              {isArabic ? "اختر المدرب" : "Select Trainer"}
            </CardTitle>
            <CardDescription>
              {isArabic
                ? "اختر مدربك الشخصي من القائمة"
                : "Choose your personal trainer from the list"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trainersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : trainersData?.content && trainersData.content.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {trainersData.content.map((trainer) => {
                  const trainerName = isArabic
                    ? trainer.displayName?.ar || trainer.displayName?.en || trainer.userName
                    : trainer.displayName?.en || trainer.displayName?.ar || trainer.userName;

                  return (
                    <Card
                      key={trainer.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedTrainerId === trainer.id && "ring-2 ring-primary"
                      )}
                      onClick={() => handleSelectTrainer(trainer.id, trainerName || "")}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={trainer.profileImageUrl} />
                            <AvatarFallback>
                              {getInitials(trainerName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{trainerName}</p>
                            {trainer.specializations && trainer.specializations.length > 0 && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {trainer.specializations.slice(0, 2).join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isArabic ? "لا يوجد مدربين متاحين" : "No trainers available"}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Select Slot */}
      {step === "slot" && selectedTrainerId && (
        <div className="space-y-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 me-2" />
            {isArabic ? "تغيير المدرب" : "Change Trainer"}
          </Button>

          <TrainerAvailability
            trainerId={selectedTrainerId}
            trainerName={selectedTrainerName}
            selectedSlot={selectedSlot}
            onSelectSlot={handleSelectSlot}
          />
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && selectedSlot && (
        <div className="space-y-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 me-2" />
            {isArabic ? "تغيير الموعد" : "Change Time"}
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? "تأكيد الحجز" : "Confirm Booking"}</CardTitle>
              <CardDescription>
                {isArabic
                  ? "راجع تفاصيل الحجز قبل التأكيد"
                  : "Review your booking details before confirming"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Booking Summary */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {isArabic ? "المدرب:" : "Trainer:"}
                  </span>
                  <span className="font-medium">{selectedTrainerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {isArabic ? "التاريخ:" : "Date:"}
                  </span>
                  <span className="font-medium">
                    {format(new Date(selectedSlot.date), "PPP", { locale: dateLocale })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {isArabic ? "الوقت:" : "Time:"}
                  </span>
                  <span className="font-medium">
                    {selectedSlot.startTime.slice(0, 5)} - {selectedSlot.endTime.slice(0, 5)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>{isArabic ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    isArabic
                      ? "أضف أي ملاحظات للمدرب..."
                      : "Add any notes for the trainer..."
                  }
                  rows={3}
                />
              </div>

              {/* Confirm Button */}
              <Button
                onClick={handleBook}
                disabled={bookMutation.isPending}
                className="w-full"
              >
                {bookMutation.isPending && (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                )}
                {isArabic ? "تأكيد الحجز" : "Confirm Booking"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Success */}
      {step === "success" && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              {isArabic ? "تم الحجز بنجاح!" : "Booking Confirmed!"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isArabic
                ? "ستتلقى إشعاراً عند تأكيد المدرب للجلسة"
                : "You'll receive a notification when the trainer confirms the session"}
            </p>
            <div className="flex justify-center gap-4">
              <Link href={`/${locale}/member/pt-sessions`}>
                <Button variant="outline">
                  {isArabic ? "عرض الجلسات" : "View Sessions"}
                </Button>
              </Link>
              <Button onClick={() => router.push(`/${locale}/member/dashboard`)}>
                {isArabic ? "العودة للرئيسية" : "Back to Dashboard"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
