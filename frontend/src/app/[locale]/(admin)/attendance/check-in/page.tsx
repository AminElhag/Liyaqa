"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, UserCheck, CheckCircle } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocalizedText } from "@/components/ui/localized-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { Loading } from "@/components/ui/spinner";
import { useMembers, useCheckIn } from "@/queries";
import { parseApiError, getLocalizedErrorMessage } from "@/lib/api";
import type { CheckInMethod } from "@/types/attendance";
import type { Member } from "@/types/member";

export default function CheckInPage() {
  const locale = useLocale();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [method, setMethod] = useState<CheckInMethod>("MANUAL");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Search for members
  const { data: members, isLoading } = useMembers(
    { search: search || undefined, status: "ACTIVE", size: 10 },
    { enabled: search.length >= 2 }
  );

  // Check-in mutation
  const checkIn = useCheckIn();

  const texts = {
    back: locale === "ar" ? "العودة" : "Back",
    title: locale === "ar" ? "تسجيل دخول عضو" : "Check In Member",
    description:
      locale === "ar"
        ? "ابحث عن عضو وقم بتسجيل دخوله"
        : "Search for a member and check them in",
    searchPlaceholder:
      locale === "ar"
        ? "ابحث بالاسم أو البريد الإلكتروني..."
        : "Search by name or email...",
    selectMember: locale === "ar" ? "اختر العضو" : "Select Member",
    method: locale === "ar" ? "طريقة التسجيل" : "Check-in Method",
    manual: locale === "ar" ? "يدوي" : "Manual",
    qrCode: locale === "ar" ? "رمز QR" : "QR Code",
    card: locale === "ar" ? "بطاقة" : "Card",
    biometric: locale === "ar" ? "بصمة" : "Biometric",
    checkIn: locale === "ar" ? "تسجيل الدخول" : "Check In",
    checking: locale === "ar" ? "جاري التسجيل..." : "Checking in...",
    noResults: locale === "ar" ? "لا توجد نتائج" : "No results found",
    searchHint:
      locale === "ar"
        ? "أدخل حرفين على الأقل للبحث"
        : "Enter at least 2 characters to search",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    status: locale === "ar" ? "الحالة" : "Status",
    selectedMember: locale === "ar" ? "العضو المختار" : "Selected Member",
    success:
      locale === "ar"
        ? "تم تسجيل دخول العضو بنجاح"
        : "Member checked in successfully",
    checkInAnother:
      locale === "ar" ? "تسجيل دخول عضو آخر" : "Check in another member",
    viewAttendance:
      locale === "ar" ? "عرض سجل الحضور" : "View attendance records",
  };

  const methodOptions: { value: CheckInMethod; label: string }[] = [
    { value: "MANUAL", label: texts.manual },
    { value: "QR_CODE", label: texts.qrCode },
    { value: "CARD", label: texts.card },
    { value: "BIOMETRIC", label: texts.biometric },
  ];

  const handleCheckIn = async () => {
    if (!selectedMember) return;

    setError(null);
    try {
      await checkIn.mutateAsync({
        memberId: selectedMember.id,
        data: { method },
      });
      setSuccess(true);
    } catch (err) {
      const apiError = await parseApiError(err);
      setError(getLocalizedErrorMessage(apiError, locale));
    }
  };

  const handleReset = () => {
    setSelectedMember(null);
    setSearch("");
    setSuccess(false);
    setError(null);
  };

  // Success state
  if (success && selectedMember) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/attendance`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {texts.back}
            </Link>
          </Button>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">{texts.success}</h2>
            <p className="text-muted-foreground">
              <LocalizedText text={selectedMember.firstName} />{" "}
              <LocalizedText text={selectedMember.lastName} />
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button onClick={handleReset} className="flex-1">
                <UserCheck className="me-2 h-4 w-4" />
                {texts.checkInAnother}
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href={`/${locale}/attendance`}>
                  {texts.viewAttendance}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/${locale}/attendance`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {texts.back}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{texts.title}</h1>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.selectMember}</CardTitle>
            <CardDescription>{texts.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={texts.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>

            {search.length < 2 && (
              <p className="text-sm text-muted-foreground">{texts.searchHint}</p>
            )}

            {search.length >= 2 && isLoading && (
              <div className="py-4 flex justify-center">
                <Loading />
              </div>
            )}

            {search.length >= 2 && !isLoading && members?.content && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {members.content.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {texts.noResults}
                  </p>
                ) : (
                  members.content.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedMember?.id === member.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            <LocalizedText text={member.firstName} />{" "}
                            <LocalizedText text={member.lastName} />
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                        <StatusBadge status={member.status} locale={locale} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check-in Section */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.selectedMember}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedMember ? (
              <>
                <div className="p-4 border rounded-lg bg-muted/20 space-y-2">
                  <p className="font-medium text-lg">
                    <LocalizedText text={selectedMember.firstName} />{" "}
                    <LocalizedText text={selectedMember.lastName} />
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        {texts.email}:
                      </span>{" "}
                      {selectedMember.email}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {texts.phone}:
                      </span>{" "}
                      {selectedMember.phone}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      {texts.status}:
                    </span>
                    <StatusBadge
                      status={selectedMember.status}
                      locale={locale}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{texts.method}</label>
                  <Select
                    value={method}
                    onValueChange={(value) => setMethod(value as CheckInMethod)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {methodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCheckIn}
                  disabled={checkIn.isPending}
                  className="w-full"
                >
                  <UserCheck className="me-2 h-4 w-4" />
                  {checkIn.isPending ? texts.checking : texts.checkIn}
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>{texts.selectMember}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
