"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Bell, Plus, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMembers } from "@/queries/use-members";
import { useMemberNotifications } from "@/queries/use-notifications-admin";
import { formatDate, formatTime } from "@/lib/utils";
import type {
  NotificationStatus,
  NotificationChannel,
} from "@/types/notification-admin";

const statusColors: Record<NotificationStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SENT: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  READ: "bg-gray-100 text-gray-600",
};

const channelLabels: Record<NotificationChannel, { en: string; ar: string }> = {
  EMAIL: { en: "Email", ar: "بريد إلكتروني" },
  SMS: { en: "SMS", ar: "رسالة نصية" },
  PUSH: { en: "Push", ar: "إشعار" },
  IN_APP: { en: "In-App", ar: "داخل التطبيق" },
};

export default function NotificationsPage() {
  const locale = useLocale();
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [page] = useState(0);

  const { data: membersData } = useMembers({ size: 100 });
  const {
    data: notifications,
    isLoading,
    refetch,
  } = useMemberNotifications(selectedMember, { page, size: 20 });

  const texts = {
    title: locale === "ar" ? "الإشعارات" : "Notifications",
    subtitle:
      locale === "ar"
        ? "إدارة وإرسال الإشعارات للأعضاء"
        : "Manage and send notifications to members",
    sendNew: locale === "ar" ? "إرسال إشعار" : "Send Notification",
    selectMember: locale === "ar" ? "اختر عضو" : "Select Member",
    noMemberSelected:
      locale === "ar"
        ? "اختر عضوًا لعرض إشعاراته"
        : "Select a member to view notifications",
    noNotifications:
      locale === "ar" ? "لا توجد إشعارات" : "No notifications found",
    refresh: locale === "ar" ? "تحديث" : "Refresh",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Bell className="h-6 w-6" />
            {texts.title}
          </h1>
          <p className="text-neutral-500">{texts.subtitle}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/manage-notifications/new`}>
            <Plus className="h-4 w-4 me-2" />
            {texts.sendNew}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectMember} />
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
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={!selectedMember}
            >
              <RefreshCw className="h-4 w-4 me-2" />
              {texts.refresh}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedMember ? (
            <p className="text-center py-8 text-neutral-500">
              {texts.noMemberSelected}
            </p>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !notifications?.content?.length ? (
            <p className="text-center py-8 text-neutral-500">
              {texts.noNotifications}
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.content.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[notification.status]}>
                        {notification.status}
                      </Badge>
                      <Badge variant="outline">
                        {
                          channelLabels[notification.channel][
                            locale === "ar" ? "ar" : "en"
                          ]
                        }
                      </Badge>
                    </div>
                    <p className="font-medium">
                      {locale === "ar"
                        ? notification.body.ar || notification.body.en
                        : notification.body.en}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {formatDate(notification.createdAt, locale)}{" "}
                      {formatTime(notification.createdAt, locale)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
