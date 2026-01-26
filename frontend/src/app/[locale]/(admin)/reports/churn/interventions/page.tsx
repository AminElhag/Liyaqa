"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Play,
  CheckCircle,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  useInterventions,
  usePrediction,
  useCreateIntervention,
  useAssignIntervention,
  useExecuteIntervention,
  useRecordInterventionOutcome,
  useDeleteIntervention,
  useActiveInterventionTemplates,
} from "@/queries/use-churn";
import {
  INTERVENTION_TYPE_LABELS,
  INTERVENTION_TYPE_LABELS_AR,
  OUTCOME_LABELS,
  OUTCOME_LABELS_AR,
  type InterventionType,
  type InterventionOutcome,
  type CreateInterventionRequest,
} from "@/types/churn";

export default function InterventionsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const searchParams = useSearchParams();
  const predictionIdParam = searchParams.get("predictionId");

  const [page, setPage] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(!!predictionIdParam);
  const [outcomeDialogOpen, setOutcomeDialogOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<string | null>(null);

  // Form state
  const [newIntervention, setNewIntervention] = useState<Partial<CreateInterventionRequest>>({
    predictionId: predictionIdParam || "",
    interventionType: "PERSONAL_CALL",
  });
  const [outcomeData, setOutcomeData] = useState<{ outcome: InterventionOutcome; notes: string }>({
    outcome: "SUCCESS",
    notes: "",
  });

  const { data: interventionsPage, isLoading } = useInterventions(page, 20);
  const { data: prediction } = usePrediction(predictionIdParam || "", {
    enabled: !!predictionIdParam,
  });
  const { data: templates } = useActiveInterventionTemplates();

  const createMutation = useCreateIntervention();
  const assignMutation = useAssignIntervention();
  const executeMutation = useExecuteIntervention();
  const outcomeMutation = useRecordInterventionOutcome();
  const deleteMutation = useDeleteIntervention();

  const getTypeLabel = (type: InterventionType) =>
    isArabic ? INTERVENTION_TYPE_LABELS_AR[type] : INTERVENTION_TYPE_LABELS[type];

  const getOutcomeLabel = (outcome: InterventionOutcome) =>
    isArabic ? OUTCOME_LABELS_AR[outcome] : OUTCOME_LABELS[outcome];

  const handleCreate = () => {
    if (!newIntervention.predictionId || !newIntervention.interventionType) return;

    createMutation.mutate(newIntervention as CreateInterventionRequest, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setNewIntervention({ predictionId: "", interventionType: "PERSONAL_CALL" });
      },
    });
  };

  const handleExecute = (id: string) => {
    executeMutation.mutate(id);
  };

  const handleRecordOutcome = () => {
    if (!selectedIntervention) return;

    outcomeMutation.mutate(
      { id: selectedIntervention, data: outcomeData },
      {
        onSuccess: () => {
          setOutcomeDialogOpen(false);
          setSelectedIntervention(null);
          setOutcomeData({ outcome: "SUCCESS", notes: "" });
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm(isArabic ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) {
      deleteMutation.mutate(id);
    }
  };

  const interventionTypes: InterventionType[] = [
    "PERSONAL_CALL",
    "DISCOUNT_OFFER",
    "FREE_PT_SESSION",
    "EMAIL_CAMPAIGN",
    "SMS_REMINDER",
    "GIFT_VOUCHER",
    "FREEZE_OFFER",
    "PLAN_UPGRADE",
    "RETENTION_MEETING",
  ];

  const outcomeOptions: InterventionOutcome[] = ["SUCCESS", "PARTIAL", "FAILED", "CANCELLED"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isArabic ? "تدخلات الاحتفاظ" : "Retention Interventions"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إدارة تدخلات الاحتفاظ بالأعضاء المعرضين للخطر"
              : "Manage interventions for at-risk members"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports/churn/predictions">
            <Button variant="outline">
              {isArabic ? "العودة للوحة التحكم" : "Back to Dashboard"}
            </Button>
          </Link>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 me-2" />
                {isArabic ? "تدخل جديد" : "New Intervention"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {isArabic ? "إنشاء تدخل جديد" : "Create New Intervention"}
                </DialogTitle>
                <DialogDescription>
                  {isArabic
                    ? "أنشئ تدخلاً للاحتفاظ بعضو معرض للخطر"
                    : "Create a retention intervention for an at-risk member"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>{isArabic ? "معرف التنبؤ" : "Prediction ID"}</Label>
                  <Input
                    value={newIntervention.predictionId || ""}
                    onChange={(e) =>
                      setNewIntervention({ ...newIntervention, predictionId: e.target.value })
                    }
                    placeholder={isArabic ? "أدخل معرف التنبؤ" : "Enter prediction ID"}
                  />
                  {prediction && (
                    <p className="text-xs text-muted-foreground">
                      {isArabic ? "العضو:" : "Member:"} {prediction.memberId.slice(0, 8)}... |{" "}
                      {isArabic ? "درجة الخطر:" : "Score:"} {prediction.churnScore}%
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? "نوع التدخل" : "Intervention Type"}</Label>
                  <Select
                    value={newIntervention.interventionType}
                    onValueChange={(v) =>
                      setNewIntervention({
                        ...newIntervention,
                        interventionType: v as InterventionType,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {interventionTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {templates && templates.length > 0 && (
                  <div className="space-y-2">
                    <Label>{isArabic ? "قالب (اختياري)" : "Template (Optional)"}</Label>
                    <Select
                      value={newIntervention.templateId || ""}
                      onValueChange={(v) =>
                        setNewIntervention({ ...newIntervention, templateId: v || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isArabic ? "اختر قالبًا" : "Select a template"} />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {isArabic && template.nameAr ? template.nameAr : template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>{isArabic ? "الوصف" : "Description"}</Label>
                  <Textarea
                    value={newIntervention.description || ""}
                    onChange={(e) =>
                      setNewIntervention({ ...newIntervention, description: e.target.value })
                    }
                    placeholder={isArabic ? "تفاصيل التدخل..." : "Intervention details..."}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? "موعد التنفيذ (اختياري)" : "Scheduled At (Optional)"}</Label>
                  <Input
                    type="datetime-local"
                    value={newIntervention.scheduledAt || ""}
                    onChange={(e) =>
                      setNewIntervention({ ...newIntervention, scheduledAt: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  {isArabic ? "إلغاء" : "Cancel"}
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending
                    ? isArabic
                      ? "جارٍ الإنشاء..."
                      : "Creating..."
                    : isArabic
                    ? "إنشاء"
                    : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Interventions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "قائمة التدخلات" : "Interventions List"}</CardTitle>
          <CardDescription>
            {interventionsPage?.totalElements
              ? isArabic
                ? `إجمالي ${interventionsPage.totalElements} تدخل`
                : `Total ${interventionsPage.totalElements} interventions`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : interventionsPage?.content.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isArabic ? "لا توجد تدخلات بعد" : "No interventions yet"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isArabic ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isArabic ? "العضو" : "Member"}</TableHead>
                    <TableHead>{isArabic ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isArabic ? "مسند إلى" : "Assigned To"}</TableHead>
                    <TableHead>{isArabic ? "موعد التنفيذ" : "Scheduled"}</TableHead>
                    <TableHead>{isArabic ? "النتيجة" : "Outcome"}</TableHead>
                    <TableHead>{isArabic ? "إجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interventionsPage?.content.map((intervention) => (
                    <TableRow key={intervention.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {getTypeLabel(intervention.interventionType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <Link
                          href={`/members/${intervention.memberId}`}
                          className="hover:underline text-primary"
                        >
                          {intervention.memberId.slice(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell>
                        {intervention.isCompleted ? (
                          <Badge className="bg-green-500">
                            {isArabic ? "مكتمل" : "Completed"}
                          </Badge>
                        ) : intervention.executedAt ? (
                          <Badge className="bg-blue-500">
                            {isArabic ? "تم التنفيذ" : "Executed"}
                          </Badge>
                        ) : intervention.isPending ? (
                          <Badge variant="secondary">
                            {isArabic ? "في الانتظار" : "Pending"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {isArabic ? "قيد التنفيذ" : "In Progress"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {intervention.assignedTo ? (
                          <span className="font-mono text-xs">
                            {intervention.assignedTo.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            {isArabic ? "غير مسند" : "Unassigned"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {intervention.scheduledAt
                          ? new Date(intervention.scheduledAt).toLocaleString(
                              isArabic ? "ar-SA" : "en-US",
                              { dateStyle: "short", timeStyle: "short" }
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {intervention.outcome ? (
                          <Badge
                            className={
                              intervention.outcome === "SUCCESS"
                                ? "bg-green-500"
                                : intervention.outcome === "PARTIAL"
                                ? "bg-yellow-500"
                                : intervention.outcome === "FAILED"
                                ? "bg-red-500"
                                : "bg-gray-500"
                            }
                          >
                            {getOutcomeLabel(intervention.outcome)}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!intervention.executedAt && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExecute(intervention.id)}
                              disabled={executeMutation.isPending}
                              title={isArabic ? "تنفيذ" : "Execute"}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {intervention.executedAt && !intervention.outcome && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedIntervention(intervention.id);
                                setOutcomeDialogOpen(true);
                              }}
                              title={isArabic ? "تسجيل النتيجة" : "Record Outcome"}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(intervention.id)}
                            disabled={deleteMutation.isPending}
                            title={isArabic ? "حذف" : "Delete"}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {interventionsPage && interventionsPage.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    {isArabic
                      ? `صفحة ${page + 1} من ${interventionsPage.totalPages}`
                      : `Page ${page + 1} of ${interventionsPage.totalPages}`}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={interventionsPage.first}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={interventionsPage.last}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Record Outcome Dialog */}
      <Dialog open={outcomeDialogOpen} onOpenChange={setOutcomeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArabic ? "تسجيل النتيجة" : "Record Outcome"}</DialogTitle>
            <DialogDescription>
              {isArabic
                ? "سجل نتيجة هذا التدخل"
                : "Record the outcome of this intervention"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{isArabic ? "النتيجة" : "Outcome"}</Label>
              <Select
                value={outcomeData.outcome}
                onValueChange={(v) =>
                  setOutcomeData({ ...outcomeData, outcome: v as InterventionOutcome })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {outcomeOptions.map((outcome) => (
                    <SelectItem key={outcome} value={outcome}>
                      {getOutcomeLabel(outcome)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isArabic ? "ملاحظات" : "Notes"}</Label>
              <Textarea
                value={outcomeData.notes}
                onChange={(e) => setOutcomeData({ ...outcomeData, notes: e.target.value })}
                placeholder={isArabic ? "ملاحظات إضافية..." : "Additional notes..."}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOutcomeDialogOpen(false)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleRecordOutcome} disabled={outcomeMutation.isPending}>
              {outcomeMutation.isPending
                ? isArabic
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : isArabic
                ? "حفظ"
                : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
