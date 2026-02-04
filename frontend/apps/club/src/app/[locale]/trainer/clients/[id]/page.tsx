"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowLeft, Mail, Phone, User, Edit, Calendar, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@liyaqa/shared/components/ui/tabs";
import { useTrainerClient } from "@liyaqa/shared/queries/use-trainer-portal";
import { ClientStatusBadge } from "@/components/trainer/client-status-badge";
import type { UUID } from "@liyaqa/shared/types/api";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const clientId = params.id as UUID;

  const { data: client, isLoading, error } = useTrainerClient(clientId);

  const texts = {
    back: locale === "ar" ? "رجوع" : "Back",
    edit: locale === "ar" ? "تعديل" : "Edit",
    overview: locale === "ar" ? "نظرة عامة" : "Overview",
    sessions: locale === "ar" ? "الجلسات" : "Sessions",
    memberInfo: locale === "ar" ? "معلومات العضو" : "Member Information",
    relationshipInfo: locale === "ar" ? "معلومات العلاقة" : "Relationship Information",
    sessionStats: locale === "ar" ? "إحصائيات الجلسات" : "Session Statistics",
    goals: locale === "ar" ? "الأهداف" : "Goals",
    notes: locale === "ar" ? "الملاحظات" : "Notes",
    name: locale === "ar" ? "الاسم" : "Name",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    status: locale === "ar" ? "الحالة" : "Status",
    startDate: locale === "ar" ? "تاريخ البدء" : "Start Date",
    endDate: locale === "ar" ? "تاريخ الانتهاء" : "End Date",
    completedSessions: locale === "ar" ? "الجلسات المكتملة" : "Completed Sessions",
    cancelledSessions: locale === "ar" ? "الجلسات الملغية" : "Cancelled Sessions",
    noShowSessions: locale === "ar" ? "جلسات الغياب" : "No Show Sessions",
    na: locale === "ar" ? "غير محدد" : "N/A",
    noGoals: locale === "ar" ? "لا توجد أهداف محددة" : "No goals set",
    noNotes: locale === "ar" ? "لا توجد ملاحظات" : "No notes",
    error: locale === "ar" ? "حدث خطأ أثناء تحميل بيانات العميل" : "Error loading client data",
    sessionsPlaceholder: locale === "ar" ? "قائمة الجلسات - سيتم التنفيذ قريباً" : "Session list - To be implemented",
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return texts.na;
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch {
      return texts.na;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/${locale}/trainer/clients`)}
        >
          <ArrowLeft className="me-2 h-4 w-4" />
          {texts.back}
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{texts.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${locale}/trainer/clients`)}
          >
            <ArrowLeft className="me-2 h-4 w-4" />
            {texts.back}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {client.memberName || texts.na}
            </h1>
            <div className="mt-1">
              <ClientStatusBadge status={client.status} />
            </div>
          </div>
        </div>
        <Button onClick={() => router.push(`/${locale}/trainer/clients/${clientId}/edit`)}>
          <Edit className="me-2 h-4 w-4" />
          {texts.edit}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{texts.overview}</TabsTrigger>
          <TabsTrigger value="sessions">{texts.sessions}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Member Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {texts.memberInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">{texts.name}</p>
                  <p className="font-medium">{client.memberName || texts.na}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {texts.email}
                  </p>
                  <p className="font-medium">{client.memberEmail || texts.na}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {texts.phone}
                  </p>
                  <p className="font-medium">{client.memberPhone || texts.na}</p>
                </div>
              </CardContent>
            </Card>

            {/* Relationship Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {texts.relationshipInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">{texts.status}</p>
                  <div className="mt-1">
                    <ClientStatusBadge status={client.status} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{texts.startDate}</p>
                  <p className="font-medium">{formatDate(client.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{texts.endDate}</p>
                  <p className="font-medium">{formatDate(client.endDate)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {texts.sessionStats}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-700 font-medium">{texts.completedSessions}</p>
                  <p className="text-3xl font-bold text-green-700">{client.completedSessions}</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-700 font-medium">{texts.cancelledSessions}</p>
                  <p className="text-3xl font-bold text-amber-700">{client.cancelledSessions}</p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700 font-medium">{texts.noShowSessions}</p>
                  <p className="text-3xl font-bold text-red-700">{client.noShowSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals Card */}
          <Card>
            <CardHeader>
              <CardTitle>{texts.goals}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">English</p>
                <p className="whitespace-pre-wrap">
                  {client.goalsEn || <span className="text-muted-foreground italic">{texts.noGoals}</span>}
                </p>
              </div>
              <div dir="rtl">
                <p className="text-sm font-medium text-muted-foreground mb-2">العربية</p>
                <p className="whitespace-pre-wrap">
                  {client.goalsAr || <span className="text-muted-foreground italic">{texts.noGoals}</span>}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardHeader>
              <CardTitle>{texts.notes}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">English</p>
                <p className="whitespace-pre-wrap">
                  {client.notesEn || <span className="text-muted-foreground italic">{texts.noNotes}</span>}
                </p>
              </div>
              <div dir="rtl">
                <p className="text-sm font-medium text-muted-foreground mb-2">العربية</p>
                <p className="whitespace-pre-wrap">
                  {client.notesAr || <span className="text-muted-foreground italic">{texts.noNotes}</span>}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">{texts.sessionsPlaceholder}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
