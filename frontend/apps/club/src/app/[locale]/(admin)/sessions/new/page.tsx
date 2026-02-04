"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, Clock, Users } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { useCreateSession, useClasses } from "@liyaqa/shared/queries/use-classes";
import { useToast } from "@liyaqa/shared/hooks/use-toast";

export default function NewSessionPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Get class ID from query params if passed
  const preSelectedClassId = searchParams.get("classId") || "";

  // Form state
  const [classId, setClassId] = useState(preSelectedClassId);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState<number | undefined>(undefined);

  // Fetch classes
  const { data: classesData, isLoading: classesLoading } = useClasses({
    status: "ACTIVE",
    size: 100,
  });

  const createSession = useCreateSession();

  const texts = {
    title: locale === "ar" ? "جلسة جديدة" : "New Session",
    description:
      locale === "ar"
        ? "إنشاء جلسة فردية لفصل"
        : "Create a single session for a class",
    back: locale === "ar" ? "العودة للجلسات" : "Back to Sessions",
    selectClass: locale === "ar" ? "اختر الفصل" : "Select Class",
    class: locale === "ar" ? "الفصل" : "Class",
    classPlaceholder: locale === "ar" ? "اختر فصل..." : "Choose a class...",
    sessionDetails: locale === "ar" ? "تفاصيل الجلسة" : "Session Details",
    date: locale === "ar" ? "التاريخ" : "Date",
    startTime: locale === "ar" ? "وقت البدء" : "Start Time",
    endTime: locale === "ar" ? "وقت الانتهاء" : "End Time",
    capacity: locale === "ar" ? "السعة" : "Capacity",
    capacityHint:
      locale === "ar"
        ? "اتركه فارغًا لاستخدام سعة الفصل الافتراضية"
        : "Leave empty to use the class default capacity",
    create: locale === "ar" ? "إنشاء الجلسة" : "Create Session",
    creating: locale === "ar" ? "جاري الإنشاء..." : "Creating...",
    successTitle: locale === "ar" ? "تم إنشاء الجلسة" : "Session Created",
    successDesc:
      locale === "ar"
        ? "تم إنشاء الجلسة بنجاح"
        : "The session has been created successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    errorDesc:
      locale === "ar"
        ? "فشل في إنشاء الجلسة"
        : "Failed to create the session",
    noClasses:
      locale === "ar" ? "لا توجد فصول متاحة" : "No classes available",
    requiredFields:
      locale === "ar"
        ? "يرجى تعبئة جميع الحقول المطلوبة"
        : "Please fill in all required fields",
  };

  const classes = classesData?.content || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!classId || !date || !startTime || !endTime) {
      toast({
        title: texts.errorTitle,
        description: texts.requiredFields,
        variant: "destructive",
      });
      return;
    }

    try {
      const session = await createSession.mutateAsync({
        classId,
        date,
        startTime,
        endTime,
        capacity: capacity || undefined,
      });
      toast({
        title: texts.successTitle,
        description: texts.successDesc,
      });
      router.push(`/${locale}/sessions/${session.id}`);
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
          <Link href={`/${locale}/sessions`}>
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
          {/* Class Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>{texts.selectClass}</CardTitle>
              </div>
              <CardDescription>
                {locale === "ar"
                  ? "اختر الفصل لإنشاء جلسة منه"
                  : "Choose the class to create a session from"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {classesLoading ? (
                <div className="flex justify-center py-4">
                  <Loading />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="classId">
                    {texts.class} <span className="text-destructive">*</span>
                  </Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger id="classId">
                      <SelectValue placeholder={texts.classPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.length === 0 ? (
                        <div className="py-2 px-3 text-sm text-muted-foreground">
                          {texts.noClasses}
                        </div>
                      ) : (
                        classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            <div className="flex items-center gap-2">
                              <span>
                                <LocalizedText text={cls.name} />
                              </span>
                              <span className="text-muted-foreground text-xs">
                                ({cls.durationMinutes}{" "}
                                {locale === "ar" ? "دقيقة" : "min"})
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

          {/* Session Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>{texts.sessionDetails}</CardTitle>
              </div>
              <CardDescription>
                {locale === "ar"
                  ? "حدد التاريخ والوقت للجلسة"
                  : "Set the date and time for the session"}
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
                  min={new Date().toISOString().split("T")[0]}
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
                  placeholder="20"
                />
                <p className="text-xs text-muted-foreground">{texts.capacityHint}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            size="lg"
            disabled={createSession.isPending || !classId || !date || !startTime || !endTime}
          >
            {createSession.isPending ? texts.creating : texts.create}
          </Button>
        </div>
      </form>
    </div>
  );
}
