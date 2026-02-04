"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Edit, Phone, Calendar, UserPlus, XCircle, RotateCcw, Plus } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@liyaqa/shared/components/ui/tabs";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { LeadForm } from "@/components/forms/lead-form";
import { LeadActivityTimeline } from "@/components/admin/lead-activity-timeline";
import { LogActivityDialog } from "@/components/admin/log-activity-dialog";
import { LeadQuickActions } from "@/components/admin/lead-quick-actions";
import { CampaignAttributionCard } from "@/components/admin/campaign-attribution-card";
import {
  useLead,
  useUpdateLead,
  useLeadActivities,
  useMarkLeadContacted,
  useScheduleLeadTour,
  useStartLeadTrial,
  useMarkLeadLost,
  useReopenLead,
  useLogLeadActivity,
  useCompleteFollowUp,
} from "@liyaqa/shared/queries/use-leads";
import {
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_PRIORITY_LABELS,
  LEAD_STATUS_COLORS,
} from "@liyaqa/shared/types/lead";
import type { CreateLeadRequest, LogActivityRequest, LeadActivityType } from "@liyaqa/shared/types/lead";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useState } from "react";

export default function LeadDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";
  const leadId = params.id as string;
  const isEditMode = searchParams.get("edit") === "true";
  const dateLocale = isArabic ? ar : enUS;

  const [logDialogOpen, setLogDialogOpen] = useState(false);

  const { data: lead, isLoading } = useLead(leadId);
  const { data: activitiesData, isLoading: activitiesLoading } = useLeadActivities(leadId, { size: 50 });
  const updateMutation = useUpdateLead();
  const contactMutation = useMarkLeadContacted();
  const tourMutation = useScheduleLeadTour();
  const trialMutation = useStartLeadTrial();
  const lostMutation = useMarkLeadLost();
  const reopenMutation = useReopenLead();
  const logActivityMutation = useLogLeadActivity();
  const completeFollowUpMutation = useCompleteFollowUp();

  const handleUpdate = async (data: CreateLeadRequest) => {
    try {
      await updateMutation.mutateAsync({ id: leadId, data });
      toast.success(isArabic ? "تم تحديث العميل المحتمل" : "Lead updated");
      router.push(`/${locale}/leads/${leadId}`);
    } catch {
      toast.error(isArabic ? "فشل في التحديث" : "Failed to update");
    }
  };

  const handleContact = async () => {
    try {
      await contactMutation.mutateAsync(leadId);
      toast.success(isArabic ? "تم تحديث الحالة" : "Status updated");
    } catch {
      toast.error(isArabic ? "فشل في التحديث" : "Failed to update");
    }
  };

  const handleScheduleTour = async () => {
    try {
      await tourMutation.mutateAsync(leadId);
      toast.success(isArabic ? "تم جدولة الجولة" : "Tour scheduled");
    } catch {
      toast.error(isArabic ? "فشل في التحديث" : "Failed to update");
    }
  };

  const handleStartTrial = async () => {
    try {
      await trialMutation.mutateAsync(leadId);
      toast.success(isArabic ? "تم بدء التجربة" : "Trial started");
    } catch {
      toast.error(isArabic ? "فشل في التحديث" : "Failed to update");
    }
  };

  const handleMarkLost = async () => {
    try {
      await lostMutation.mutateAsync({ id: leadId });
      toast.success(isArabic ? "تم وضع علامة كمفقود" : "Marked as lost");
    } catch {
      toast.error(isArabic ? "فشل في التحديث" : "Failed to update");
    }
  };

  const handleReopen = async () => {
    try {
      await reopenMutation.mutateAsync(leadId);
      toast.success(isArabic ? "تم إعادة فتح العميل المحتمل" : "Lead reopened");
    } catch {
      toast.error(isArabic ? "فشل في التحديث" : "Failed to update");
    }
  };

  const handleLogActivity = async (data: LogActivityRequest) => {
    await logActivityMutation.mutateAsync({
      leadId,
      data,
    });
    toast.success(isArabic ? "تم تسجيل النشاط" : "Activity logged");
  };

  const handleQuickLogActivity = async (type: LeadActivityType) => {
    try {
      await logActivityMutation.mutateAsync({
        leadId,
        data: { type },
      });
      toast.success(isArabic ? "تم تسجيل النشاط" : "Activity logged");
    } catch {
      toast.error(isArabic ? "فشل في تسجيل النشاط" : "Failed to log activity");
    }
  };

  const handleCompleteFollowUp = async (activityId: string) => {
    try {
      await completeFollowUpMutation.mutateAsync({
        activityId,
        data: {},
      });
      toast.success(isArabic ? "تم إكمال المتابعة" : "Follow-up completed");
    } catch {
      toast.error(isArabic ? "فشل في إكمال المتابعة" : "Failed to complete follow-up");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {isArabic ? "العميل المحتمل غير موجود" : "Lead not found"}
        </p>
      </div>
    );
  }

  const statusLabel = LEAD_STATUS_LABELS[lead.status];
  const sourceLabel = LEAD_SOURCE_LABELS[lead.source];
  const priorityLabel = lead.priority ? LEAD_PRIORITY_LABELS[lead.priority] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/leads`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
              <Badge className={LEAD_STATUS_COLORS[lead.status]}>
                {isArabic ? statusLabel.ar : statusLabel.en}
              </Badge>
            </div>
            <p className="text-muted-foreground">{lead.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Quick Actions */}
          {!isEditMode && lead.status !== "WON" && lead.status !== "LOST" && (
            <LeadQuickActions
              lead={lead}
              onLogActivity={handleQuickLogActivity}
              onScheduleTour={lead.status === "CONTACTED" ? handleScheduleTour : undefined}
              onOpenLogDialog={() => setLogDialogOpen(true)}
              isLoading={logActivityMutation.isPending}
            />
          )}

          <div className="flex gap-2">
            {lead.status === "NEW" && (
              <Button variant="outline" onClick={handleContact}>
                <Phone className="h-4 w-4 me-2" />
                {isArabic ? "تم التواصل" : "Mark Contacted"}
              </Button>
            )}
            {lead.status === "TOUR_SCHEDULED" && (
              <Button variant="outline" onClick={handleStartTrial}>
                <UserPlus className="h-4 w-4 me-2" />
                {isArabic ? "بدء التجربة" : "Start Trial"}
              </Button>
            )}
            {lead.status === "LOST" && (
              <Button variant="outline" onClick={handleReopen}>
                <RotateCcw className="h-4 w-4 me-2" />
                {isArabic ? "إعادة فتح" : "Reopen"}
              </Button>
            )}
            {lead.status !== "WON" && lead.status !== "LOST" && (
              <Button variant="outline" onClick={handleMarkLost}>
                <XCircle className="h-4 w-4 me-2" />
                {isArabic ? "وضع كمفقود" : "Mark Lost"}
              </Button>
            )}
            {!isEditMode && (
              <Link href={`/${locale}/leads/${leadId}?edit=true`}>
                <Button>
                  <Edit className="h-4 w-4 me-2" />
                  {isArabic ? "تعديل" : "Edit"}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {isEditMode ? (
        <div className="max-w-3xl">
          <LeadForm
            lead={lead}
            onSubmit={handleUpdate}
            isPending={updateMutation.isPending}
          />
        </div>
      ) : (
        <>
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">
              {isArabic ? "التفاصيل" : "Details"}
            </TabsTrigger>
            <TabsTrigger value="timeline">
              {isArabic ? "النشاطات" : "Timeline"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>{isArabic ? "معلومات الاتصال" : "Contact Info"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isArabic ? "البريد الإلكتروني" : "Email"}</span>
                    <span className="font-medium">{lead.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isArabic ? "الهاتف" : "Phone"}</span>
                    <span className="font-medium">{lead.phone || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isArabic ? "المصدر" : "Source"}</span>
                    <span className="font-medium">{isArabic ? sourceLabel.ar : sourceLabel.en}</span>
                  </div>
                  {priorityLabel && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isArabic ? "الأولوية" : "Priority"}</span>
                      <span className="font-medium">{isArabic ? priorityLabel.ar : priorityLabel.en}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isArabic ? "النقاط" : "Score"}</span>
                    <span className="font-medium">{lead.score}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Status Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>{isArabic ? "مراحل العميل" : "Lead Journey"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isArabic ? "تاريخ الإنشاء" : "Created"}</span>
                    <span className="font-medium">
                      {format(new Date(lead.createdAt), "PPP", { locale: dateLocale })}
                    </span>
                  </div>
                  {lead.contactedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isArabic ? "تم التواصل" : "Contacted"}</span>
                      <span className="font-medium">{lead.contactedAt}</span>
                    </div>
                  )}
                  {lead.tourScheduledAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isArabic ? "جولة مجدولة" : "Tour Scheduled"}</span>
                      <span className="font-medium">{lead.tourScheduledAt}</span>
                    </div>
                  )}
                  {lead.trialStartedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isArabic ? "بدء التجربة" : "Trial Started"}</span>
                      <span className="font-medium">{lead.trialStartedAt}</span>
                    </div>
                  )}
                  {lead.wonAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isArabic ? "تم الفوز" : "Won"}</span>
                      <span className="font-medium text-green-600">{lead.wonAt}</span>
                    </div>
                  )}
                  {lead.lostAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isArabic ? "تم الخسارة" : "Lost"}</span>
                      <span className="font-medium text-red-600">{lead.lostAt}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Campaign Attribution */}
            <CampaignAttributionCard lead={lead} />

            {/* Notes */}
            {lead.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>{isArabic ? "ملاحظات" : "Notes"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{lead.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="timeline">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setLogDialogOpen(true)}>
                  <Plus className="h-4 w-4 me-2" />
                  {isArabic ? "تسجيل نشاط" : "Log Activity"}
                </Button>
              </div>

              {activitiesLoading ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <LeadActivityTimeline
                  activities={activitiesData?.content || []}
                  onCompleteFollowUp={handleCompleteFollowUp}
                  isCompletingFollowUp={completeFollowUpMutation.isPending}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Log Activity Dialog */}
        <LogActivityDialog
          open={logDialogOpen}
          onOpenChange={setLogDialogOpen}
          onSubmit={handleLogActivity}
          isPending={logActivityMutation.isPending}
        />
        </>
      )}
    </div>
  );
}
