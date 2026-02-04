"use client";

import { use, useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { useSession, useUpdateSession } from "@liyaqa/shared/queries/use-classes";
import { useToast } from "@liyaqa/shared/hooks/use-toast";

interface EditSessionPageProps {
  params: Promise<{ id: string }>;
}

export default function EditSessionPage({ params }: EditSessionPageProps) {
  const { id } = use(params);
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState<number | undefined>(undefined);

  // Fetch session
  const { data: session, isLoading, error } = useSession(id);
  const updateSession = useUpdateSession();

  // Initialize form with session data
  useEffect(() => {
    if (session) {
      setDate(session.date);
      setStartTime(session.startTime);
      setEndTime(session.endTime);
      setCapacity(session.capacity);
    }
  }, [session]);

  const texts = {
    title: locale === "ar" ? "تعديل الجلسة" : "Edit Session",
    description:
      locale === "ar"
        ? "تعديل تفاصيل الجلسة"
        : "Modify the session details",
    back: locale === "ar" ? "العودة للجلسة" : "Back to Session",
    sessionDetails: locale === "ar" ? "تفاصيل الجلسة" : "Session Details",
    class: locale === "ar" ? "الفصل" : "Class",
    date: locale === "ar" ? "التاريخ" : "Date",
    startTime: locale === "ar" ? "وقت البدء" : "Start Time",
    endTime: locale === "ar" ? "وقت الانتهاء" : "End Time",
    capacity: locale === "ar" ? "السعة" : "Capacity",
    save: locale === "ar" ? "حفظ التغييرات" : "Save Changes",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
    successTitle: locale === "ar" ? "تم الحفظ" : "Saved",
    successDesc:
      locale === "ar"
        ? "تم حفظ التغييرات بنجاح"
        : "Changes saved successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    errorDesc:
      locale === "ar"
        ? "فشل في حفظ التغييرات"
        : "Failed to save changes",
    notFound: locale === "ar" ? "لم يتم العثور على الجلسة" : "Session not found",
    requiredFields:
      locale === "ar"
        ? "يرجى تعبئة جميع الحقول المطلوبة"
        : "Please fill in all required fields",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !startTime || !endTime) {
      toast({
        title: texts.errorTitle,
        description: texts.requiredFields,
        variant: "destructive",
      });
      return;
    }

    try {
      await updateSession.mutateAsync({
        id,
        data: {
          date,
          startTime,
          endTime,
          capacity: capacity || undefined,
        },
      });
      toast({
        title: texts.successTitle,
        description: texts.successDesc,
      });
      router.push(`/${locale}/sessions/${id}`);
    } catch (error) {
      toast({
        title: texts.errorTitle,
        description: error instanceof Error ? error.message : texts.errorDesc,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/sessions`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {texts.back}
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
            <p>{texts.notFound}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/sessions/${id}`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {texts.back}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
          <Calendar className="h-6 w-6" />
          {texts.title}
        </h1>
        <p className="text-neutral-500">
          <LocalizedText text={session.className} />
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Class Info (Read-only) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>{texts.class}</CardTitle>
              </div>
              <CardDescription>
                {locale === "ar"
                  ? "معلومات الفصل (للقراءة فقط)"
                  : "Class information (read-only)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">
                  <LocalizedText text={session.className} />
                </p>
                {session.trainerName && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {locale === "ar" ? "المدرب:" : "Trainer:"}{" "}
                    <LocalizedText text={session.trainerName} />
                  </p>
                )}
                {session.locationName && (
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar" ? "الموقع:" : "Location:"}{" "}
                    <LocalizedText text={session.locationName} />
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Session Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>{texts.sessionDetails}</CardTitle>
              </div>
              <CardDescription>
                {locale === "ar"
                  ? "عدّل التاريخ والوقت للجلسة"
                  : "Modify the date and time for the session"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">
                  {texts.date} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* Start Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">
                    {texts.startTime} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                {/* End Time */}
                <div className="space-y-2">
                  <Label htmlFor="endTime">
                    {texts.endTime} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity">{texts.capacity}</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={capacity || ""}
                  onChange={(e) =>
                    setCapacity(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            size="lg"
            disabled={updateSession.isPending || !date || !startTime || !endTime}
          >
            {updateSession.isPending ? texts.saving : texts.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
