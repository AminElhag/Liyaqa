"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@liyaqa/shared/components/ui/dialog";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Plus } from "lucide-react";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { DSRTimeline } from "@/components/compliance/dsr-timeline";
import { getDSRColumns } from "@/components/admin/dsr-columns";
import {
  useDSRs,
  useDSRStats,
  useCreateDSR,
  useVerifyDSRIdentity,
  useStartDSRProcessing,
  useCompleteDSR,
  useRejectDSR,
} from "@liyaqa/shared/queries/use-data-protection";
import type {
  DataSubjectRequest,
  DSRParams,
  DataSubjectRequestType,
  DSRStatus,
  DSRPriority,
  VerificationMethod,
  ResponseMethod,
} from "@liyaqa/shared/types/data-protection";

export default function DSRWorkflowPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDSR, setSelectedDSR] = useState<DataSubjectRequest | null>(null);
  const [filters, setFilters] = useState<DSRParams>({});

  const [createForm, setCreateForm] = useState({
    requesterName: "",
    requesterEmail: "",
    requesterPhone: "",
    requestType: "ACCESS" as DataSubjectRequestType,
    description: "",
    priority: "NORMAL" as DSRPriority,
  });

  const [verifyMethod, setVerifyMethod] = useState<VerificationMethod>("EMAIL_VERIFICATION");
  const [responseMethod, setResponseMethod] = useState<ResponseMethod>("EMAIL");
  const [rejectReason, setRejectReason] = useState("");

  const { data: dsrs, isLoading } = useDSRs(filters);
  const { data: stats, isLoading: loadingStats } = useDSRStats();

  const createDSR = useCreateDSR();
  const verifyIdentity = useVerifyDSRIdentity();
  const startProcessing = useStartDSRProcessing();
  const completeDSR = useCompleteDSR();
  const rejectDSR = useRejectDSR();

  const handleCreate = () => {
    createDSR.mutate(
      {
        requesterName: createForm.requesterName,
        requesterEmail: createForm.requesterEmail,
        requesterPhone: createForm.requesterPhone || undefined,
        requestType: createForm.requestType,
        description: createForm.description || undefined,
        priority: createForm.priority,
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          setCreateForm({
            requesterName: "",
            requesterEmail: "",
            requesterPhone: "",
            requestType: "ACCESS",
            description: "",
            priority: "NORMAL",
          });
        },
      }
    );
  };

  const handleVerify = () => {
    if (!selectedDSR) return;
    verifyIdentity.mutate(
      {
        id: selectedDSR.id,
        request: { method: verifyMethod },
      },
      {
        onSuccess: () => {
          setVerifyDialogOpen(false);
          setSelectedDSR(null);
        },
      }
    );
  };

  const handleProcess = (dsr: DataSubjectRequest) => {
    startProcessing.mutate(dsr.id);
  };

  const handleComplete = () => {
    if (!selectedDSR) return;
    completeDSR.mutate(
      {
        id: selectedDSR.id,
        request: { responseMethod },
      },
      {
        onSuccess: () => {
          setCompleteDialogOpen(false);
          setSelectedDSR(null);
        },
      }
    );
  };

  const handleReject = () => {
    if (!selectedDSR) return;
    rejectDSR.mutate(
      {
        id: selectedDSR.id,
        reason: rejectReason,
      },
      {
        onSuccess: () => {
          setRejectDialogOpen(false);
          setSelectedDSR(null);
          setRejectReason("");
        },
      }
    );
  };

  const columns = getDSRColumns({
    locale,
    onView: (dsr) => {
      setSelectedDSR(dsr);
      setViewDialogOpen(true);
    },
    onVerify: (dsr) => {
      setSelectedDSR(dsr);
      setVerifyDialogOpen(true);
    },
    onProcess: handleProcess,
    onComplete: (dsr) => {
      setSelectedDSR(dsr);
      setCompleteDialogOpen(true);
    },
    onReject: (dsr) => {
      setSelectedDSR(dsr);
      setRejectDialogOpen(true);
    },
  });

  const requestTypeLabels: Record<DataSubjectRequestType, { en: string; ar: string }> = {
    ACCESS: { en: "Access", ar: "الوصول" },
    RECTIFICATION: { en: "Rectification", ar: "التصحيح" },
    ERASURE: { en: "Erasure", ar: "المحو" },
    RESTRICTION: { en: "Restriction", ar: "تقييد المعالجة" },
    PORTABILITY: { en: "Portability", ar: "قابلية النقل" },
    OBJECTION: { en: "Objection", ar: "الاعتراض" },
    AUTOMATED_DECISION_OPT_OUT: { en: "Opt-Out Automated", ar: "إلغاء القرار الآلي" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isArabic ? "طلبات أصحاب البيانات" : "Data Subject Requests"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إدارة طلبات الوصول والتصحيح والمحو (المواد 15-23 من PDPL)"
              : "Manage access, rectification, erasure requests (PDPL Articles 15-23)"}
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? "طلب جديد" : "New Request"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isArabic ? "إنشاء طلب جديد" : "Create New Request"}</DialogTitle>
              <DialogDescription>
                {isArabic
                  ? "تسجيل طلب صاحب بيانات جديد"
                  : "Register a new data subject request"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{isArabic ? "اسم مقدم الطلب" : "Requester Name"}</Label>
                <Input
                  value={createForm.requesterName}
                  onChange={(e) => setCreateForm({ ...createForm, requesterName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "البريد الإلكتروني" : "Email"}</Label>
                <Input
                  type="email"
                  value={createForm.requesterEmail}
                  onChange={(e) => setCreateForm({ ...createForm, requesterEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "رقم الهاتف" : "Phone"}</Label>
                <Input
                  value={createForm.requesterPhone}
                  onChange={(e) => setCreateForm({ ...createForm, requesterPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "نوع الطلب" : "Request Type"}</Label>
                <Select
                  value={createForm.requestType}
                  onValueChange={(v) => setCreateForm({ ...createForm, requestType: v as DataSubjectRequestType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(requestTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {isArabic ? label.ar : label.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "الأولوية" : "Priority"}</Label>
                <Select
                  value={createForm.priority}
                  onValueChange={(v) => setCreateForm({ ...createForm, priority: v as DSRPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">{isArabic ? "منخفض" : "Low"}</SelectItem>
                    <SelectItem value="NORMAL">{isArabic ? "عادي" : "Normal"}</SelectItem>
                    <SelectItem value="HIGH">{isArabic ? "عالي" : "High"}</SelectItem>
                    <SelectItem value="URGENT">{isArabic ? "عاجل" : "Urgent"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "الوصف" : "Description"}</Label>
                <Textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!createForm.requesterName || !createForm.requesterEmail || createDSR.isPending}
              >
                {isArabic ? "إنشاء" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "إجمالي الطلبات" : "Total Requests"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.totalRequests ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "في الانتظار" : "Pending"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{stats?.pendingRequests ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "متأخرة" : "Overdue"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{stats?.overdueRequests ?? 0}</p>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? "تجاوزت 30 يوم" : "> 30 days"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "متوسط الإكمال" : "Avg. Completion"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats?.averageCompletionDays?.toFixed(1) ?? "-"}</p>
                <p className="text-xs text-muted-foreground">{isArabic ? "أيام" : "days"}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "الفلاتر" : "Filters"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Select
              value={filters.requestType || "all"}
              onValueChange={(v) =>
                setFilters({ ...filters, requestType: v === "all" ? undefined : (v as DataSubjectRequestType) })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isArabic ? "نوع الطلب" : "Request Type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? "جميع الأنواع" : "All Types"}</SelectItem>
                {Object.entries(requestTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {isArabic ? label.ar : label.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status || "all"}
              onValueChange={(v) =>
                setFilters({ ...filters, status: v === "all" ? undefined : (v as DSRStatus) })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isArabic ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? "جميع الحالات" : "All Statuses"}</SelectItem>
                <SelectItem value="RECEIVED">{isArabic ? "مستلم" : "Received"}</SelectItem>
                <SelectItem value="IDENTITY_VERIFICATION">{isArabic ? "التحقق من الهوية" : "Verifying"}</SelectItem>
                <SelectItem value="IN_PROGRESS">{isArabic ? "قيد المعالجة" : "In Progress"}</SelectItem>
                <SelectItem value="COMPLETED">{isArabic ? "مكتمل" : "Completed"}</SelectItem>
                <SelectItem value="REJECTED">{isArabic ? "مرفوض" : "Rejected"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* DSRs Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "قائمة الطلبات" : "Requests List"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "جميع طلبات أصحاب البيانات المسجلة"
              : "All recorded data subject requests"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <DataTable
              columns={columns}
              data={dsrs?.content ?? []}
              searchKey="requesterName"
              searchPlaceholder={isArabic ? "البحث عن الطلبات..." : "Search requests..."}
            />
          )}
        </CardContent>
      </Card>

      {/* View DSR Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isArabic ? "تفاصيل الطلب" : "Request Details"}</DialogTitle>
          </DialogHeader>
          {selectedDSR && (
            <div className="space-y-6">
              <DSRTimeline currentStatus={selectedDSR.status} isArabic={isArabic} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "رقم الطلب" : "Request #"}</Label>
                  <p className="font-mono">{selectedDSR.requestNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "النوع" : "Type"}</Label>
                  <p>{isArabic ? requestTypeLabels[selectedDSR.requestType].ar : requestTypeLabels[selectedDSR.requestType].en}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "مقدم الطلب" : "Requester"}</Label>
                  <p>{selectedDSR.requesterName}</p>
                  <p className="text-sm text-muted-foreground">{selectedDSR.requesterEmail}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "تاريخ الاستحقاق" : "Due Date"}</Label>
                  <p className={selectedDSR.isOverdue ? "text-red-600 font-medium" : ""}>
                    {new Date(selectedDSR.dueDate).toLocaleDateString(isArabic ? "ar-SA" : "en-US")}
                    {selectedDSR.isOverdue && <span className="block text-sm">{isArabic ? "متأخر!" : "Overdue!"}</span>}
                  </p>
                </div>
              </div>
              {selectedDSR.description && (
                <div>
                  <Label className="text-muted-foreground">{isArabic ? "الوصف" : "Description"}</Label>
                  <p className="text-sm">{selectedDSR.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              {isArabic ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Identity Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArabic ? "التحقق من الهوية" : "Verify Identity"}</DialogTitle>
            <DialogDescription>
              {isArabic
                ? "حدد طريقة التحقق من هوية مقدم الطلب"
                : "Select the method used to verify the requester's identity"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isArabic ? "طريقة التحقق" : "Verification Method"}</Label>
              <Select value={verifyMethod} onValueChange={(v) => setVerifyMethod(v as VerificationMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ID_DOCUMENT">{isArabic ? "وثيقة هوية" : "ID Document"}</SelectItem>
                  <SelectItem value="EMAIL_VERIFICATION">{isArabic ? "تحقق البريد الإلكتروني" : "Email Verification"}</SelectItem>
                  <SelectItem value="SMS_VERIFICATION">{isArabic ? "تحقق الرسائل القصيرة" : "SMS Verification"}</SelectItem>
                  <SelectItem value="KNOWLEDGE_BASED">{isArabic ? "أسئلة معرفية" : "Knowledge-based"}</SelectItem>
                  <SelectItem value="IN_PERSON">{isArabic ? "شخصياً" : "In Person"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleVerify} disabled={verifyIdentity.isPending}>
              {isArabic ? "تأكيد التحقق" : "Confirm Verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete DSR Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArabic ? "إكمال الطلب" : "Complete Request"}</DialogTitle>
            <DialogDescription>
              {isArabic
                ? "حدد طريقة تسليم الرد لصاحب البيانات"
                : "Select the response delivery method to the data subject"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isArabic ? "طريقة الرد" : "Response Method"}</Label>
              <Select value={responseMethod} onValueChange={(v) => setResponseMethod(v as ResponseMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">{isArabic ? "البريد الإلكتروني" : "Email"}</SelectItem>
                  <SelectItem value="PORTAL">{isArabic ? "بوابة الخدمة الذاتية" : "Portal"}</SelectItem>
                  <SelectItem value="POSTAL">{isArabic ? "البريد" : "Postal"}</SelectItem>
                  <SelectItem value="IN_PERSON">{isArabic ? "شخصياً" : "In Person"}</SelectItem>
                  <SelectItem value="SECURE_DOWNLOAD">{isArabic ? "تحميل آمن" : "Secure Download"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleComplete} disabled={completeDSR.isPending}>
              {isArabic ? "إكمال" : "Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject DSR Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArabic ? "رفض الطلب" : "Reject Request"}</DialogTitle>
            <DialogDescription>
              {isArabic
                ? "أدخل سبب رفض الطلب"
                : "Enter the reason for rejecting this request"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isArabic ? "سبب الرفض" : "Rejection Reason"}</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={isArabic ? "أدخل سبب الرفض..." : "Enter rejection reason..."}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason || rejectDSR.isPending}
            >
              {isArabic ? "رفض" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
