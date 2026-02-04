"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, User, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { useCreateBooking } from "@liyaqa/shared/queries/use-bookings";
import { useClassSessions } from "@liyaqa/shared/queries/use-classes";
import { useMembers } from "@liyaqa/shared/queries/use-members";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { formatDate } from "@liyaqa/shared/utils";

export default function NewBookingPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Get session/member ID from query params if passed
  const preSelectedSessionId = searchParams.get("sessionId") || "";
  const preSelectedMemberId = searchParams.get("memberId") || "";

  // Form state
  const [sessionId, setSessionId] = useState(preSelectedSessionId);
  const [memberId, setMemberId] = useState(preSelectedMemberId);
  const [memberSearch, setMemberSearch] = useState("");

  // Default to upcoming sessions
  const today = new Date().toISOString().split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Fetch data
  const { data: sessionsData, isLoading: sessionsLoading } = useClassSessions({
    dateFrom: today,
    dateTo: nextMonth,
    status: "SCHEDULED",
    size: 50,
  });
  const { data: membersData, isLoading: membersLoading } = useMembers({
    search: memberSearch || undefined,
    status: "ACTIVE",
    size: 50,
  });

  const createBooking = useCreateBooking();

  const texts = {
    title: locale === "ar" ? "حجز جديد" : "New Booking",
    description:
      locale === "ar"
        ? "إنشاء حجز جديد لعضو في جلسة"
        : "Create a new booking for a member in a session",
    back: locale === "ar" ? "العودة للحجوزات" : "Back to Bookings",
    selectSession: locale === "ar" ? "اختر الجلسة" : "Select Session",
    session: locale === "ar" ? "الجلسة" : "Session",
    sessionPlaceholder: locale === "ar" ? "اختر جلسة..." : "Choose a session...",
    selectMember: locale === "ar" ? "اختر العضو" : "Select Member",
    member: locale === "ar" ? "العضو" : "Member",
    memberPlaceholder: locale === "ar" ? "اختر عضو..." : "Choose a member...",
    searchMember: locale === "ar" ? "البحث عن عضو..." : "Search member...",
    spotsAvailable: locale === "ar" ? "أماكن متاحة" : "spots available",
    full: locale === "ar" ? "ممتلئ" : "Full",
    create: locale === "ar" ? "إنشاء الحجز" : "Create Booking",
    creating: locale === "ar" ? "جاري الإنشاء..." : "Creating...",
    successTitle: locale === "ar" ? "تم إنشاء الحجز" : "Booking Created",
    successDesc:
      locale === "ar"
        ? "تم إنشاء الحجز بنجاح"
        : "The booking has been created successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    errorDesc:
      locale === "ar"
        ? "فشل في إنشاء الحجز"
        : "Failed to create the booking",
    noSessions:
      locale === "ar"
        ? "لا توجد جلسات متاحة"
        : "No sessions available",
    noMembers:
      locale === "ar"
        ? "لا توجد أعضاء متطابقين"
        : "No matching members",
    requiredFields:
      locale === "ar"
        ? "يرجى اختيار الجلسة والعضو"
        : "Please select both session and member",
  };

  const sessions = sessionsData?.content || [];
  const members = membersData?.content || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionId || !memberId) {
      toast({
        title: texts.errorTitle,
        description: texts.requiredFields,
        variant: "destructive",
      });
      return;
    }

    try {
      const booking = await createBooking.mutateAsync({
        sessionId,
        memberId,
      });
      toast({
        title: texts.successTitle,
        description: texts.successDesc,
      });
      router.push(`/${locale}/bookings/${booking.id}`);
    } catch (error) {
      toast({
        title: texts.errorTitle,
        description: error instanceof Error ? error.message : texts.errorDesc,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/bookings`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {texts.back}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
          <Calendar className="h-6 w-6" />
          {texts.title}
        </h1>
        <p className="text-neutral-500">{texts.description}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Session Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>{texts.selectSession}</CardTitle>
              </div>
              <CardDescription>
                {locale === "ar"
                  ? "اختر الجلسة التي تريد الحجز فيها"
                  : "Choose the session you want to book"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="flex justify-center py-4">
                  <Loading />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="sessionId">
                    {texts.session} <span className="text-destructive">*</span>
                  </Label>
                  <Select value={sessionId} onValueChange={setSessionId}>
                    <SelectTrigger id="sessionId">
                      <SelectValue placeholder={texts.sessionPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.length === 0 ? (
                        <div className="py-2 px-3 text-sm text-muted-foreground">
                          {texts.noSessions}
                        </div>
                      ) : (
                        sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            <div className="flex items-center gap-2">
                              <span>
                                <LocalizedText text={session.className} />
                              </span>
                              <span className="text-muted-foreground">
                                {formatDate(session.date, locale)}
                              </span>
                              <span className="text-muted-foreground font-mono text-xs">
                                {session.startTime}
                              </span>
                              {session.availableSpots > 0 ? (
                                <Badge variant="success" className="text-xs">
                                  {session.availableSpots} {texts.spotsAvailable}
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">
                                  {texts.full}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Member Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>{texts.selectMember}</CardTitle>
              </div>
              <CardDescription>
                {locale === "ar"
                  ? "اختر العضو الذي تريد حجزه"
                  : "Choose the member to book"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="memberSearch">{texts.searchMember}</Label>
                <Input
                  id="memberSearch"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder={texts.searchMember}
                />
              </div>

              {membersLoading ? (
                <div className="flex justify-center py-4">
                  <Loading />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="memberId">
                    {texts.member} <span className="text-destructive">*</span>
                  </Label>
                  <Select value={memberId} onValueChange={setMemberId}>
                    <SelectTrigger id="memberId">
                      <SelectValue placeholder={texts.memberPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {members.length === 0 ? (
                        <div className="py-2 px-3 text-sm text-muted-foreground">
                          {texts.noMembers}
                        </div>
                      ) : (
                        members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>
                                <LocalizedText text={member.firstName} />{" "}
                                <LocalizedText text={member.lastName} />
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {member.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            size="lg"
            disabled={createBooking.isPending || !sessionId || !memberId}
          >
            {createBooking.isPending ? texts.creating : texts.create}
          </Button>
        </div>
      </form>
    </div>
  );
}
