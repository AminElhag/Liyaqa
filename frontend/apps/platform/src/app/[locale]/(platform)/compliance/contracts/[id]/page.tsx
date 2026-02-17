"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  RefreshCw,
  ExternalLink,
  Shield,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { cn } from "@liyaqa/shared/utils";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useContractById,
  useRenewContract,
} from "@liyaqa/shared/queries/platform/use-compliance";
import type { ContractStatus, ContractType } from "@liyaqa/shared/types/platform/compliance";

const STATUS_CONFIG: Record<ContractStatus, { variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "danger" | "info"; label: string; labelAr: string }> = {
  DRAFT: { variant: "secondary", label: "Draft", labelAr: "مسودة" },
  SENT: { variant: "info", label: "Sent", labelAr: "مُرسل" },
  SIGNED: { variant: "info", label: "Signed", labelAr: "موقّع" },
  ACTIVE: { variant: "success", label: "Active", labelAr: "نشط" },
  EXPIRED: { variant: "warning", label: "Expired", labelAr: "منتهي" },
  TERMINATED: { variant: "destructive", label: "Terminated", labelAr: "منهي" },
};

const TYPE_LABELS: Record<ContractType, { en: string; ar: string }> = {
  SERVICE_AGREEMENT: { en: "Service Agreement", ar: "اتفاقية خدمة" },
  SLA: { en: "SLA", ar: "اتفاقية مستوى الخدمة" },
  DATA_PROCESSING: { en: "Data Processing", ar: "معالجة بيانات" },
  CUSTOM: { en: "Custom", ar: "مخصص" },
};

export default function ContractDetailPage() {
  const params = useParams();
  const contractId = params.id as string;
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { toast } = useToast();

  const [showRenewForm, setShowRenewForm] = useState(false);
  const [newEndDate, setNewEndDate] = useState("");
  const [newValue, setNewValue] = useState("");

  const { data: contract, isLoading, error } = useContractById(contractId);
  const renewContract = useRenewContract();

  const texts = {
    back: isRtl ? "العودة إلى العقود" : "Back to Contracts",
    edit: isRtl ? "تعديل" : "Edit",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
    notFound: isRtl ? "العقد غير موجود" : "Contract not found",
    errorLoading: isRtl ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    contractInfo: isRtl ? "معلومات العقد" : "Contract Information",
    tenantInfo: isRtl ? "معلومات المستأجر" : "Tenant Information",
    financialInfo: isRtl ? "المعلومات المالية" : "Financial Information",
    dates: isRtl ? "التواريخ" : "Dates",
    contractNumber: isRtl ? "رقم العقد" : "Contract Number",
    type: isRtl ? "النوع" : "Type",
    status: isRtl ? "الحالة" : "Status",
    tenant: isRtl ? "المستأجر" : "Tenant",
    tenantId: isRtl ? "معرّف المستأجر" : "Tenant ID",
    startDate: isRtl ? "تاريخ البدء" : "Start Date",
    endDate: isRtl ? "تاريخ الانتهاء" : "End Date",
    autoRenew: isRtl ? "تجديد تلقائي" : "Auto Renew",
    value: isRtl ? "القيمة" : "Value",
    document: isRtl ? "المستند" : "Document",
    viewDocument: isRtl ? "عرض المستند" : "View Document",
    createdAt: isRtl ? "تاريخ الإنشاء" : "Created At",
    updatedAt: isRtl ? "آخر تحديث" : "Last Updated",
    yes: isRtl ? "نعم" : "Yes",
    no: isRtl ? "لا" : "No",
    renew: isRtl ? "تجديد العقد" : "Renew Contract",
    newEndDate: isRtl ? "تاريخ الانتهاء الجديد" : "New End Date",
    newValue: isRtl ? "القيمة الجديدة (اختياري)" : "New Value (optional)",
    submitRenew: isRtl ? "تأكيد التجديد" : "Confirm Renewal",
    cancelRenew: isRtl ? "إلغاء" : "Cancel",
    renewSuccess: isRtl ? "تم تجديد العقد بنجاح" : "Contract renewed successfully",
    errorTitle: isRtl ? "خطأ" : "Error",
    notSet: isRtl ? "غير محدد" : "Not set",
  };

  const formatDate = (dateString: string | undefined, includeTime = false) => {
    if (!dateString) return texts.notSet;
    return new Date(dateString).toLocaleDateString(isRtl ? "ar-SA" : "en-SA", includeTime
      ? { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
      : { year: "numeric", month: "long", day: "numeric" }
    );
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat(isRtl ? "ar-SA" : "en-SA", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleRenew = () => {
    if (!newEndDate) return;
    renewContract.mutate(
      {
        id: contractId,
        data: {
          newEndDate,
          newValue: newValue ? parseFloat(newValue) : undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: texts.renewSuccess });
          setShowRenewForm(false);
          setNewEndDate("");
          setNewValue("");
        },
        onError: (err) => {
          toast({ title: texts.errorTitle, description: err.message, variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.errorLoading : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  const statusConfig = STATUS_CONFIG[contract.status];
  const typeLabel = TYPE_LABELS[contract.type];
  const tenantDisplayName = isRtl
    ? contract.tenantNameAr || contract.tenantName || contract.tenantId
    : contract.tenantName || contract.tenantNameAr || contract.tenantId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/compliance/contracts`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight font-mono">
                {contract.contractNumber}
              </h1>
              <Badge variant={statusConfig.variant}>
                {isRtl ? statusConfig.labelAr : statusConfig.label}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">{tenantDisplayName}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${locale}/compliance/contracts/${contractId}/edit`}>
              <Edit className="me-2 h-4 w-4" />
              {texts.edit}
            </Link>
          </Button>
          {contract.status === "ACTIVE" && (
            <Button variant="outline" onClick={() => setShowRenewForm(!showRenewForm)}>
              <RefreshCw className="me-2 h-4 w-4" />
              {texts.renew}
            </Button>
          )}
        </div>
      </div>

      {/* Renew Form (inline) */}
      {showRenewForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              {texts.renew}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newEndDate">{texts.newEndDate}</Label>
                <Input
                  id="newEndDate"
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newValue">{texts.newValue}</Label>
                <Input
                  id="newValue"
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleRenew}
                disabled={!newEndDate || renewContract.isPending}
              >
                {texts.submitRenew}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRenewForm(false);
                  setNewEndDate("");
                  setNewValue("");
                }}
              >
                {texts.cancelRenew}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contract Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>{texts.contractInfo}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.contractNumber}</p>
                <p className="font-mono font-medium">{contract.contractNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.type}</p>
                <p className="font-medium">{isRtl ? typeLabel.ar : typeLabel.en}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.status}</p>
                <Badge variant={statusConfig.variant}>
                  {isRtl ? statusConfig.labelAr : statusConfig.label}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.autoRenew}</p>
                <Badge variant={contract.autoRenew ? "success" : "outline"}>
                  {contract.autoRenew ? texts.yes : texts.no}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenant Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>{texts.tenantInfo}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{texts.tenant}</p>
              <p className="font-medium">{tenantDisplayName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{texts.tenantId}</p>
              <p className="font-mono text-sm">{contract.tenantId}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dates Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>{texts.dates}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.startDate}</p>
                <p className="font-medium">{formatDate(contract.startDate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.endDate}</p>
                <p className={cn("font-medium", contract.status === "EXPIRED" && "text-destructive")}>
                  {formatDate(contract.endDate)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.createdAt}</p>
                <p className="text-sm">{formatDate(contract.createdAt, true)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.updatedAt}</p>
                <p className="text-sm">{formatDate(contract.updatedAt, true)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>{texts.financialInfo}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{texts.value}</p>
              <p className="text-2xl font-bold">
                {contract.value && contract.currency
                  ? formatCurrency(contract.value, contract.currency)
                  : texts.notSet}
              </p>
            </div>
            {contract.documentUrl && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.document}</p>
                <a
                  href={contract.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {texts.viewDocument}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
