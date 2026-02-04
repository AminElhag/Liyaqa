"use client";

import { useLocale } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  User,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Download,
  Shield,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { cn } from "@liyaqa/shared/utils";
import { useContract, useApproveContract, useVoidContract } from "@liyaqa/shared/queries/use-admin-contracts";
import { ContractStatus, ContractTerm, ContractType } from "@liyaqa/shared/types/contract";
import { toast } from "sonner";

export default function ContractDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;
  const isArabic = locale === "ar";

  const { data: contract, isLoading } = useContract(contractId);
  const approveMutation = useApproveContract();
  const voidMutation = useVoidContract();

  const texts = {
    back: isArabic ? "العودة للعقود" : "Back to Contracts",
    contractDetails: isArabic ? "تفاصيل العقد" : "Contract Details",
    memberInfo: isArabic ? "معلومات العضو" : "Member Information",
    planInfo: isArabic ? "معلومات الباقة" : "Plan Information",
    contractTerms: isArabic ? "شروط العقد" : "Contract Terms",
    timeline: isArabic ? "الجدول الزمني" : "Timeline",
    actions: isArabic ? "الإجراءات" : "Actions",
    approve: isArabic ? "الموافقة على العقد" : "Approve Contract",
    void: isArabic ? "إلغاء العقد" : "Void Contract",
    download: isArabic ? "تحميل PDF" : "Download PDF",
    contractNumber: isArabic ? "رقم العقد" : "Contract Number",
    status: isArabic ? "الحالة" : "Status",
    memberName: isArabic ? "اسم العضو" : "Member Name",
    email: isArabic ? "البريد الإلكتروني" : "Email",
    planName: isArabic ? "اسم الباقة" : "Plan Name",
    category: isArabic ? "الفئة" : "Category",
    monthlyFee: isArabic ? "الرسوم الشهرية" : "Monthly Fee",
    contractType: isArabic ? "نوع العقد" : "Contract Type",
    term: isArabic ? "مدة العقد" : "Contract Term",
    commitment: isArabic ? "فترة الالتزام" : "Commitment Period",
    months: isArabic ? "شهور" : "months",
    noticePeriod: isArabic ? "فترة الإشعار" : "Notice Period",
    days: isArabic ? "أيام" : "days",
    coolingOff: isArabic ? "فترة التراجع" : "Cooling-Off Period",
    active: isArabic ? "نشط" : "Active",
    expired: isArabic ? "منتهي" : "Expired",
    startDate: isArabic ? "تاريخ البدء" : "Start Date",
    commitmentEnd: isArabic ? "نهاية الالتزام" : "Commitment End",
    coolingOffEnd: isArabic ? "نهاية فترة التراجع" : "Cooling-Off End",
    memberSigned: isArabic ? "توقيع العضو" : "Member Signed",
    staffApproved: isArabic ? "موافقة الموظف" : "Staff Approved",
    notSigned: isArabic ? "لم يوقع" : "Not Signed",
    notApproved: isArabic ? "لم توافق" : "Not Approved",
    monthToMonth: isArabic ? "شهري" : "Month-to-Month",
    fixedTerm: isArabic ? "محدد المدة" : "Fixed Term",
  };

  const getStatusBadge = (status: ContractStatus) => {
    const config: Record<ContractStatus, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; label: string }> = {
      PENDING_SIGNATURE: { variant: "outline", icon: <Clock className="h-3 w-3" />, label: isArabic ? "في انتظار التوقيع" : "Pending Signature" },
      ACTIVE: { variant: "default", icon: <CheckCircle className="h-3 w-3" />, label: isArabic ? "نشط" : "Active" },
      IN_NOTICE_PERIOD: { variant: "secondary", icon: <AlertTriangle className="h-3 w-3" />, label: isArabic ? "فترة الإشعار" : "Notice Period" },
      CANCELLED: { variant: "destructive", icon: <XCircle className="h-3 w-3" />, label: isArabic ? "ملغي" : "Cancelled" },
      EXPIRED: { variant: "secondary", icon: <Clock className="h-3 w-3" />, label: isArabic ? "منتهي" : "Expired" },
      SUSPENDED: { variant: "destructive", icon: <AlertTriangle className="h-3 w-3" />, label: isArabic ? "معلق" : "Suspended" },
      VOIDED: { variant: "destructive", icon: <XCircle className="h-3 w-3" />, label: isArabic ? "ملغى" : "Voided" },
    };
    const c = config[status];
    return (
      <Badge variant={c.variant} className="gap-1">
        {c.icon}
        {c.label}
      </Badge>
    );
  };

  const getTermLabel = (term: ContractTerm) => {
    const labels: Record<ContractTerm, string> = {
      MONTHLY: isArabic ? "شهري" : "Monthly",
      QUARTERLY: isArabic ? "ربع سنوي" : "Quarterly",
      SEMI_ANNUAL: isArabic ? "نصف سنوي" : "Semi-Annual",
      ANNUAL: isArabic ? "سنوي" : "Annual",
    };
    return labels[term];
  };

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(contractId);
      toast.success(isArabic ? "تمت الموافقة على العقد" : "Contract approved");
    } catch {
      toast.error(isArabic ? "فشل في الموافقة" : "Failed to approve");
    }
  };

  const handleVoid = async () => {
    try {
      await voidMutation.mutateAsync({ id: contractId, reason: "Admin action" });
      toast.success(isArabic ? "تم إلغاء العقد" : "Contract voided");
    } catch {
      toast.error(isArabic ? "فشل في الإلغاء" : "Failed to void");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          {isArabic ? "العقد غير موجود" : "Contract not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isArabic && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-4", isArabic && "flex-row-reverse")}>
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className={cn("h-5 w-5", isArabic && "rotate-180")} />
          </Button>
          <div className={cn(isArabic && "text-right")}>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              {texts.contractDetails}
            </h1>
            <p className="text-muted-foreground font-mono">{contract.contractNumber}</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-2", isArabic && "flex-row-reverse")}>
          {contract.status === "PENDING_SIGNATURE" && (
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              <CheckCircle className="h-4 w-4 me-2" />
              {texts.approve}
            </Button>
          )}
          {contract.status === "ACTIVE" && (
            <Button variant="destructive" onClick={handleVoid} disabled={voidMutation.isPending}>
              <XCircle className="h-4 w-4 me-2" />
              {texts.void}
            </Button>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 me-2" />
            {texts.download}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Status */}
          <Card className="rounded-md3-lg">
            <CardHeader className="pb-3">
              <div className={cn("flex items-center justify-between", isArabic && "flex-row-reverse")}>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {texts.status}
                </CardTitle>
                {getStatusBadge(contract.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoItem
                  label={texts.contractType}
                  value={contract.contractType === "FIXED_TERM" ? texts.fixedTerm : texts.monthToMonth}
                  isArabic={isArabic}
                />
                <InfoItem
                  label={texts.term}
                  value={getTermLabel(contract.contractTerm)}
                  isArabic={isArabic}
                />
                <InfoItem
                  label={texts.commitment}
                  value={`${contract.commitmentMonths} ${texts.months}`}
                  isArabic={isArabic}
                />
                <InfoItem
                  label={texts.noticePeriod}
                  value={`${contract.noticePeriodDays} ${texts.days}`}
                  isArabic={isArabic}
                />
              </div>
              {contract.isWithinCoolingOff && (
                <div className="mt-4 p-3 rounded-md3-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <div className={cn("flex items-center gap-2", isArabic && "flex-row-reverse")}>
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      {texts.coolingOff}: {texts.active}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {isArabic ? "ينتهي في" : "Ends"}: {new Date(contract.coolingOffEndDate).toLocaleDateString(isArabic ? "ar-SA" : undefined)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Member Info */}
          <Card className="rounded-md3-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {texts.memberInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem
                  label={texts.memberName}
                  value={contract.memberName}
                  isArabic={isArabic}
                />
                <InfoItem
                  label={texts.email}
                  value={contract.memberEmail}
                  isArabic={isArabic}
                />
              </div>
              <div className="mt-4">
                <Link href={`/${locale}/members/${contract.memberId}`}>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 me-2" />
                    {isArabic ? "عرض ملف العضو" : "View Member Profile"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Plan Info */}
          <Card className="rounded-md3-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {texts.planInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoItem
                  label={texts.planName}
                  value={contract.planName}
                  isArabic={isArabic}
                />
                {contract.categoryName && (
                  <InfoItem
                    label={texts.category}
                    value={contract.categoryName}
                    isArabic={isArabic}
                  />
                )}
                <InfoItem
                  label={texts.monthlyFee}
                  value={`${contract.lockedMonthlyFee} ${contract.lockedCurrency}`}
                  isArabic={isArabic}
                  highlight
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card className="rounded-md3-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {texts.timeline}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TimelineItem
                  label={texts.startDate}
                  date={contract.startDate}
                  isArabic={isArabic}
                  completed
                />
                {contract.memberSignedAt && (
                  <TimelineItem
                    label={texts.memberSigned}
                    date={contract.memberSignedAt}
                    isArabic={isArabic}
                    completed
                  />
                )}
                <TimelineItem
                  label={texts.coolingOffEnd}
                  date={contract.coolingOffEndDate}
                  isArabic={isArabic}
                  completed={!contract.isWithinCoolingOff}
                />
                {contract.commitmentEndDate && (
                  <TimelineItem
                    label={texts.commitmentEnd}
                    date={contract.commitmentEndDate}
                    isArabic={isArabic}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Signature Status */}
          <Card className="rounded-md3-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {isArabic ? "حالة التوقيع" : "Signature Status"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={cn("flex items-center justify-between", isArabic && "flex-row-reverse")}>
                  <span className="text-sm text-muted-foreground">{texts.memberSigned}</span>
                  {contract.memberSignedAt ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {new Date(contract.memberSignedAt).toLocaleDateString(isArabic ? "ar-SA" : undefined)}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {texts.notSigned}
                    </Badge>
                  )}
                </div>
                <div className={cn("flex items-center justify-between", isArabic && "flex-row-reverse")}>
                  <span className="text-sm text-muted-foreground">{texts.staffApproved}</span>
                  {contract.staffApprovedBy ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {isArabic ? "تم" : "Yes"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {texts.notApproved}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
  isArabic: boolean;
  highlight?: boolean;
}

function InfoItem({ label, value, isArabic, highlight }: InfoItemProps) {
  return (
    <div className={cn(isArabic && "text-right")}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium", highlight && "text-lg text-primary")}>{value}</dd>
    </div>
  );
}

interface TimelineItemProps {
  label: string;
  date: string;
  isArabic: boolean;
  completed?: boolean;
}

function TimelineItem({ label, date, isArabic, completed }: TimelineItemProps) {
  return (
    <div className={cn("flex items-start gap-3", isArabic && "flex-row-reverse")}>
      <div className={cn(
        "h-2 w-2 rounded-full mt-2",
        completed ? "bg-green-500" : "bg-muted-foreground/30"
      )} />
      <div className={cn(isArabic && "text-right")}>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(date).toLocaleDateString(isArabic ? "ar-SA" : undefined)}
        </p>
      </div>
    </div>
  );
}
