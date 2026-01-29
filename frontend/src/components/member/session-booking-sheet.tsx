"use client";

import { useState } from "react";
import { Clock, Users, MapPin, User, Loader2, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LocalizedText } from "@/components/ui/localized-text";
import { Loading } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useBookingOptions, useBookClassSession } from "@/queries/use-member-classes";
import type { ClassSession, BookingPaymentSource } from "@/types/scheduling";
import type { UUID } from "@/types/api";
import { cn } from "@/lib/utils";

interface SessionBookingSheetProps {
  session: ClassSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
}

const texts = {
  en: {
    bookSession: "Book Session",
    sessionDetails: "Session Details",
    date: "Date",
    time: "Time",
    trainer: "Trainer",
    location: "Location",
    spotsAvailable: "spots available",
    full: "Full",
    waitlistAvailable: "Waitlist available",
    paymentMethod: "Pay with",
    membership: "Membership",
    membershipDesc: "Use your subscription credits",
    classesRemaining: "classes remaining",
    classPack: "Class Pack",
    classPackDesc: "Use class pack credits",
    credits: "credits",
    expires: "expires",
    payPerEntry: "Pay Now",
    payPerEntryDesc: "One-time payment",
    inclTax: "incl. tax",
    book: "Book Now",
    booking: "Booking...",
    joinWaitlist: "Join Waitlist",
    cancel: "Cancel",
    cannotBook: "Cannot Book",
    bookingSuccess: "Booking confirmed!",
    bookingError: "Failed to book session",
    noPaymentOptions: "No payment options available",
    noPaymentOptionsDesc: "You don't have any valid payment methods for this class",
  },
  ar: {
    bookSession: "حجز الحصة",
    sessionDetails: "تفاصيل الحصة",
    date: "التاريخ",
    time: "الوقت",
    trainer: "المدرب",
    location: "الموقع",
    spotsAvailable: "أماكن متاحة",
    full: "مكتمل",
    waitlistAvailable: "قائمة الانتظار متاحة",
    paymentMethod: "الدفع عن طريق",
    membership: "العضوية",
    membershipDesc: "استخدم رصيد اشتراكك",
    classesRemaining: "حصص متبقية",
    classPack: "باقة الحصص",
    classPackDesc: "استخدم رصيد الباقة",
    credits: "رصيد",
    expires: "تنتهي",
    payPerEntry: "ادفع الآن",
    payPerEntryDesc: "دفع لمرة واحدة",
    inclTax: "شامل الضريبة",
    book: "احجز الآن",
    booking: "جاري الحجز...",
    joinWaitlist: "انضم لقائمة الانتظار",
    cancel: "إلغاء",
    cannotBook: "لا يمكن الحجز",
    bookingSuccess: "تم تأكيد الحجز!",
    bookingError: "فشل في حجز الحصة",
    noPaymentOptions: "لا توجد خيارات دفع",
    noPaymentOptionsDesc: "ليس لديك طرق دفع صالحة لهذه الحصة",
  },
};

export function SessionBookingSheet({
  session,
  open,
  onOpenChange,
  locale,
}: SessionBookingSheetProps) {
  const t = texts[locale as "en" | "ar"] || texts.en;
  const { toast } = useToast();
  const dateLocale = locale === "ar" ? ar : enUS;

  const [selectedPayment, setSelectedPayment] = useState<{
    source: BookingPaymentSource;
    balanceId?: UUID;
  } | null>(null);

  // Fetch booking options
  const { data: options, isLoading: optionsLoading } = useBookingOptions(
    session?.id || null
  );

  // Book mutation
  const bookSession = useBookClassSession();

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleBook = async () => {
    if (!session || !selectedPayment) return;

    try {
      await bookSession.mutateAsync({
        sessionId: session.id,
        paymentSource: selectedPayment.source,
        classPackBalanceId: selectedPayment.balanceId,
      });

      toast({ title: t.bookingSuccess });
      onOpenChange(false);
      setSelectedPayment(null);
    } catch {
      toast({ title: t.bookingError, variant: "destructive" });
    }
  };

  if (!session) return null;

  const isFull = session.availableSpots <= 0;
  const hasWaitlist = session.waitlistEnabled && isFull;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t.bookSession}</SheetTitle>
          <SheetDescription>
            <LocalizedText text={session.className} />
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Session Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              {t.sessionDetails}
            </h4>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm">
                    {format(parseISO(session.date), "EEEE, MMMM d", { locale: dateLocale })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session.startTime.slice(0, 5)} - {session.endTime.slice(0, 5)}
                  </p>
                </div>
              </div>

              {session.trainerName && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    <LocalizedText text={session.trainerName} />
                  </p>
                </div>
              )}

              {session.locationName && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    <LocalizedText text={session.locationName} />
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">
                  {isFull ? (
                    <span className="text-muted-foreground">
                      {t.full}
                      {hasWaitlist && (
                        <span className="text-amber-600 ms-2">({t.waitlistAvailable})</span>
                      )}
                    </span>
                  ) : (
                    <span>
                      {session.availableSpots} {t.spotsAvailable}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          {optionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loading />
            </div>
          ) : !options?.canBook ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium">{t.cannotBook}</p>
              <p className="text-sm text-muted-foreground mt-1">{options?.reason}</p>
            </div>
          ) : options.options.membership?.available ||
            (options.options.classPacks && options.options.classPacks.length > 0) ||
            options.options.payPerEntry?.available ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t.paymentMethod}
              </h4>

              <RadioGroup
                value={
                  selectedPayment
                    ? `${selectedPayment.source}${selectedPayment.balanceId ? `-${selectedPayment.balanceId}` : ""}`
                    : ""
                }
                onValueChange={(value) => {
                  if (value.startsWith("CLASS_PACK-")) {
                    setSelectedPayment({
                      source: "CLASS_PACK",
                      balanceId: value.replace("CLASS_PACK-", ""),
                    });
                  } else {
                    setSelectedPayment({
                      source: value as BookingPaymentSource,
                    });
                  }
                }}
              >
                {/* Membership Option */}
                {options.options.membership?.available && (
                  <div
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors",
                      selectedPayment?.source === "MEMBERSHIP_INCLUDED" &&
                        "border-primary bg-primary/5"
                    )}
                    onClick={() =>
                      setSelectedPayment({ source: "MEMBERSHIP_INCLUDED" })
                    }
                  >
                    <RadioGroupItem value="MEMBERSHIP_INCLUDED" id="membership" />
                    <Label htmlFor="membership" className="flex-1 cursor-pointer">
                      <p className="font-medium">{t.membership}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.membershipDesc} ({options.options.membership.classesRemaining}{" "}
                        {t.classesRemaining})
                      </p>
                    </Label>
                    <Badge variant="success">{locale === "ar" ? "مجاني" : "Free"}</Badge>
                  </div>
                )}

                {/* Class Pack Options */}
                {options.options.classPacks?.map((pack) => (
                  <div
                    key={pack.balanceId}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors",
                      selectedPayment?.balanceId === pack.balanceId &&
                        "border-primary bg-primary/5"
                    )}
                    onClick={() =>
                      setSelectedPayment({
                        source: "CLASS_PACK",
                        balanceId: pack.balanceId,
                      })
                    }
                  >
                    <RadioGroupItem
                      value={`CLASS_PACK-${pack.balanceId}`}
                      id={pack.balanceId}
                    />
                    <Label htmlFor={pack.balanceId} className="flex-1 cursor-pointer">
                      <p className="font-medium">
                        <LocalizedText text={pack.packName} />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {pack.classesRemaining} {t.credits}
                        {pack.expiresAt && (
                          <span className="ms-2">
                            ({t.expires} {format(parseISO(pack.expiresAt), "MMM d")})
                          </span>
                        )}
                      </p>
                    </Label>
                  </div>
                ))}

                {/* Pay Per Entry Option */}
                {options.options.payPerEntry?.available && (
                  <div
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors",
                      selectedPayment?.source === "PAY_PER_ENTRY" &&
                        "border-primary bg-primary/5"
                    )}
                    onClick={() => setSelectedPayment({ source: "PAY_PER_ENTRY" })}
                  >
                    <RadioGroupItem value="PAY_PER_ENTRY" id="pay" />
                    <Label htmlFor="pay" className="flex-1 cursor-pointer">
                      <p className="font-medium">{t.payPerEntry}</p>
                      <p className="text-sm text-muted-foreground">{t.payPerEntryDesc}</p>
                    </Label>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatPrice(
                          options.options.payPerEntry.totalWithTax.amount,
                          options.options.payPerEntry.totalWithTax.currency
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{t.inclTax}</p>
                    </div>
                  </div>
                )}
              </RadioGroup>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium">{t.noPaymentOptions}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t.noPaymentOptionsDesc}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedPayment || bookSession.isPending}
              onClick={handleBook}
            >
              {bookSession.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t.booking}
                </>
              ) : hasWaitlist ? (
                t.joinWaitlist
              ) : (
                t.book
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
