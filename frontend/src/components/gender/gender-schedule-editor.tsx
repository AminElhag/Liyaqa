"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Plus, Trash2, Clock, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useGenderSchedules,
  useAddGenderSchedule,
  useDeleteGenderSchedule,
} from "@/queries/use-gender-policies";
import {
  DAYS_OF_WEEK,
  GENDERS,
  type DayOfWeek,
  type AccessGender,
  type GenderScheduleResponse,
} from "@/types/gender-policy";
import { cn } from "@/lib/utils";

interface GenderScheduleEditorProps {
  locationId: string;
  className?: string;
}

const DAY_ORDER: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export function GenderScheduleEditor({ locationId, className }: GenderScheduleEditorProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: "SUNDAY" as DayOfWeek,
    startTime: "06:00",
    endTime: "12:00",
    gender: "MALE" as AccessGender,
  });

  const { data: schedules, isLoading } = useGenderSchedules(locationId);
  const addMutation = useAddGenderSchedule();
  const deleteMutation = useDeleteGenderSchedule(locationId);

  const texts = {
    title: isArabic ? "جدول الجنس" : "Gender Schedule",
    description: isArabic
      ? "تحديد أوقات الرجال والنساء لهذا الموقع"
      : "Define male and female time slots for this location",
    addSchedule: isArabic ? "إضافة جدول" : "Add Schedule",
    day: isArabic ? "اليوم" : "Day",
    startTime: isArabic ? "وقت البدء" : "Start Time",
    endTime: isArabic ? "وقت الانتهاء" : "End Time",
    gender: isArabic ? "الجنس" : "Gender",
    actions: isArabic ? "الإجراءات" : "Actions",
    delete: isArabic ? "حذف" : "Delete",
    save: isArabic ? "حفظ" : "Save",
    cancel: isArabic ? "إلغاء" : "Cancel",
    noSchedules: isArabic ? "لا يوجد جداول" : "No schedules defined",
    addFirst: isArabic ? "أضف أول جدول زمني" : "Add your first time slot",
    dialogTitle: isArabic ? "إضافة فترة زمنية" : "Add Time Slot",
    dialogDescription: isArabic
      ? "تحديد فترة زمنية لجنس معين"
      : "Define a time period for a specific gender",
    successAdd: isArabic ? "تمت الإضافة" : "Schedule Added",
    successDelete: isArabic ? "تم الحذف" : "Schedule Deleted",
    error: isArabic ? "خطأ" : "Error",
  };

  const handleAddSchedule = async () => {
    try {
      await addMutation.mutateAsync({
        locationId,
        request: newSchedule,
      });
      toast({ title: texts.successAdd });
      setIsDialogOpen(false);
      setNewSchedule({
        dayOfWeek: "SUNDAY",
        startTime: "06:00",
        endTime: "12:00",
        gender: "MALE",
      });
    } catch (error) {
      toast({
        title: texts.error,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await deleteMutation.mutateAsync(scheduleId);
      toast({ title: texts.successDelete });
    } catch (error) {
      toast({
        title: texts.error,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Group schedules by day
  const schedulesByDay = DAY_ORDER.reduce(
    (acc, day) => {
      acc[day] = (schedules || []).filter((s) => s.dayOfWeek === day);
      return acc;
    },
    {} as Record<DayOfWeek, GenderScheduleResponse[]>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {texts.title}
            </CardTitle>
            <CardDescription>{texts.description}</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {texts.addSchedule}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{texts.dialogTitle}</DialogTitle>
                <DialogDescription>{texts.dialogDescription}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{texts.day}</Label>
                  <Select
                    value={newSchedule.dayOfWeek}
                    onValueChange={(v) =>
                      setNewSchedule({ ...newSchedule, dayOfWeek: v as DayOfWeek })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_ORDER.map((day) => (
                        <SelectItem key={day} value={day}>
                          {isArabic ? DAYS_OF_WEEK[day].ar : DAYS_OF_WEEK[day].en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{texts.startTime}</Label>
                    <Input
                      type="time"
                      value={newSchedule.startTime}
                      onChange={(e) =>
                        setNewSchedule({ ...newSchedule, startTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{texts.endTime}</Label>
                    <Input
                      type="time"
                      value={newSchedule.endTime}
                      onChange={(e) =>
                        setNewSchedule({ ...newSchedule, endTime: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{texts.gender}</Label>
                  <Select
                    value={newSchedule.gender}
                    onValueChange={(v) =>
                      setNewSchedule({ ...newSchedule, gender: v as AccessGender })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">
                        {isArabic ? GENDERS.MALE.ar : GENDERS.MALE.en}
                      </SelectItem>
                      <SelectItem value="FEMALE">
                        {isArabic ? GENDERS.FEMALE.ar : GENDERS.FEMALE.en}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {texts.cancel}
                </Button>
                <Button onClick={handleAddSchedule} disabled={addMutation.isPending}>
                  {texts.save}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!schedules || schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{texts.noSchedules}</p>
            <p className="text-sm">{texts.addFirst}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{texts.day}</TableHead>
                <TableHead>{texts.startTime}</TableHead>
                <TableHead>{texts.endTime}</TableHead>
                <TableHead>{texts.gender}</TableHead>
                <TableHead className="w-[100px]">{texts.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DAY_ORDER.map((day) =>
                schedulesByDay[day].map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {isArabic ? DAYS_OF_WEEK[day].ar : DAYS_OF_WEEK[day].en}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {schedule.startTime}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {schedule.endTime}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          schedule.gender === "MALE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-pink-100 text-pink-800"
                        )}
                      >
                        {isArabic
                          ? GENDERS[schedule.gender].ar
                          : GENDERS[schedule.gender].en}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
