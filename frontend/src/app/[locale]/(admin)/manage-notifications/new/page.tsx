"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMembers } from "@/queries/use-members";
import { useSendNotification } from "@/queries/use-notifications-admin";
import type {
  NotificationChannel,
  NotificationPriority,
} from "@/types/notification-admin";

const schema = z.object({
  memberId: z.string().min(1, "Member is required"),
  channel: z.enum(["EMAIL", "SMS", "PUSH", "IN_APP"]),
  notificationType: z.literal("CUSTOM"),
  subjectEn: z.string().optional(),
  subjectAr: z.string().optional(),
  bodyEn: z.string().min(1, "Message is required"),
  bodyAr: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
});

type FormValues = z.infer<typeof schema>;

export default function NewNotificationPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const { data: membersData } = useMembers({ size: 100 });
  const sendNotification = useSendNotification();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      channel: "EMAIL",
      notificationType: "CUSTOM",
      priority: "NORMAL",
    },
  });

  const selectedChannel = watch("channel");

  const texts = {
    back: locale === "ar" ? "العودة للإشعارات" : "Back to Notifications",
    title: locale === "ar" ? "إرسال إشعار جديد" : "Send New Notification",
    member: locale === "ar" ? "العضو" : "Member",
    channel: locale === "ar" ? "قناة الإرسال" : "Channel",
    priority: locale === "ar" ? "الأولوية" : "Priority",
    subjectEn: locale === "ar" ? "العنوان (إنجليزي)" : "Subject (English)",
    subjectAr: locale === "ar" ? "العنوان (عربي)" : "Subject (Arabic)",
    bodyEn: locale === "ar" ? "الرسالة (إنجليزي)" : "Message (English)",
    bodyAr: locale === "ar" ? "الرسالة (عربي)" : "Message (Arabic)",
    send: locale === "ar" ? "إرسال" : "Send",
    sending: locale === "ar" ? "جاري الإرسال..." : "Sending...",
    success:
      locale === "ar"
        ? "تم إرسال الإشعار بنجاح"
        : "Notification sent successfully",
    error:
      locale === "ar" ? "فشل في إرسال الإشعار" : "Failed to send notification",
    priorityLow: locale === "ar" ? "منخفضة" : "Low",
    priorityNormal: locale === "ar" ? "عادية" : "Normal",
    priorityHigh: locale === "ar" ? "عالية" : "High",
    priorityUrgent: locale === "ar" ? "عاجلة" : "Urgent",
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const member = membersData?.content?.find((m) => m.id === data.memberId);
      await sendNotification.mutateAsync({
        ...data,
        recipientEmail: member?.email,
        recipientPhone: member?.phone,
      });
      toast({ title: texts.success });
      router.push(`/${locale}/manage-notifications`);
    } catch {
      toast({ title: texts.error, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/manage-notifications`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {texts.back}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900">{texts.title}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Member Selection */}
            <div className="space-y-2">
              <Label>{texts.member}</Label>
              <Select
                value={watch("memberId")}
                onValueChange={(v) => setValue("memberId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.member} />
                </SelectTrigger>
                <SelectContent>
                  {membersData?.content?.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName?.en} {member.lastName?.en} -{" "}
                      {member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.memberId && (
                <p className="text-sm text-destructive">
                  {errors.memberId.message}
                </p>
              )}
            </div>

            {/* Channel & Priority */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{texts.channel}</Label>
                <Select
                  value={watch("channel")}
                  onValueChange={(v) =>
                    setValue("channel", v as NotificationChannel)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{texts.priority}</Label>
                <Select
                  value={watch("priority")}
                  onValueChange={(v) =>
                    setValue("priority", v as NotificationPriority)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">{texts.priorityLow}</SelectItem>
                    <SelectItem value="NORMAL">
                      {texts.priorityNormal}
                    </SelectItem>
                    <SelectItem value="HIGH">{texts.priorityHigh}</SelectItem>
                    <SelectItem value="URGENT">
                      {texts.priorityUrgent}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subject (for EMAIL) */}
            {selectedChannel === "EMAIL" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subjectEn">{texts.subjectEn}</Label>
                  <Input id="subjectEn" {...register("subjectEn")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjectAr">{texts.subjectAr}</Label>
                  <Input id="subjectAr" {...register("subjectAr")} dir="rtl" />
                </div>
              </div>
            )}

            {/* Body */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bodyEn">{texts.bodyEn}</Label>
                <Textarea id="bodyEn" {...register("bodyEn")} rows={4} />
                {errors.bodyEn && (
                  <p className="text-sm text-destructive">
                    {errors.bodyEn.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyAr">{texts.bodyAr}</Label>
                <Textarea
                  id="bodyAr"
                  {...register("bodyAr")}
                  rows={4}
                  dir="rtl"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <Button type="submit" disabled={sendNotification.isPending}>
                <Send className="h-4 w-4 me-2" />
                {sendNotification.isPending ? texts.sending : texts.send}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
