"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Edit,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { cn } from "@liyaqa/shared/utils";
import {
  useContracts,
  useExpiringContracts,
} from "@liyaqa/shared/queries/platform/use-compliance";
import type {
  ComplianceContract,
  ContractStatus,
  ContractType,
} from "@liyaqa/shared/types/platform/compliance";

type StatusFilter = "ALL" | ContractStatus;
type TypeFilter = "ALL" | ContractType;

const CONTRACT_STATUS_CONFIG: Record<ContractStatus, { variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "danger" | "info"; label: string; labelAr: string }> = {
  DRAFT: { variant: "secondary", label: "Draft", labelAr: "مسودة" },
  SENT: { variant: "info", label: "Sent", labelAr: "مُرسل" },
  SIGNED: { variant: "info", label: "Signed", labelAr: "موقّع" },
  ACTIVE: { variant: "success", label: "Active", labelAr: "نشط" },
  EXPIRED: { variant: "warning", label: "Expired", labelAr: "منتهي" },
  TERMINATED: { variant: "destructive", label: "Terminated", labelAr: "منهي" },
};

const CONTRACT_TYPE_LABELS: Record<ContractType, { en: string; ar: string }> = {
  SERVICE_AGREEMENT: { en: "Service Agreement", ar: "اتفاقية خدمة" },
  SLA: { en: "SLA", ar: "اتفاقية مستوى الخدمة" },
  DATA_PROCESSING: { en: "Data Processing", ar: "معالجة بيانات" },
  CUSTOM: { en: "Custom", ar: "مخصص" },
};

export default function ContractsListPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");

  const { data: contracts, isLoading, error } = useContracts();
  const { data: expiringContracts } = useExpiringContracts(30);

  const texts = {
    title: isRtl ? "عقود الامتثال" : "Compliance Contracts",
    description: isRtl ? "إدارة عقود الامتثال للمنصة" : "Manage platform compliance contracts",
    newContract: isRtl ? "عقد جديد" : "New Contract",
    total: isRtl ? "الإجمالي" : "Total",
    active: isRtl ? "نشط" : "Active",
    expiringSoon: isRtl ? "ينتهي قريباً" : "Expiring Soon",
    expired: isRtl ? "منتهي" : "Expired",
    filterStatus: isRtl ? "تصفية بالحالة" : "Filter by Status",
    filterType: isRtl ? "تصفية بالنوع" : "Filter by Type",
    all: isRtl ? "الكل" : "All",
    noContracts: isRtl ? "لا توجد عقود" : "No contracts found",
    loadingError: isRtl ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    contractNumber: isRtl ? "رقم العقد" : "Contract #",
    tenant: isRtl ? "المستأجر" : "Tenant",
    type: isRtl ? "النوع" : "Type",
    status: isRtl ? "الحالة" : "Status",
    startDate: isRtl ? "تاريخ البدء" : "Start Date",
    endDate: isRtl ? "تاريخ الانتهاء" : "End Date",
    value: isRtl ? "القيمة" : "Value",
    autoRenew: isRtl ? "تجديد تلقائي" : "Auto Renew",
    actions: isRtl ? "الإجراءات" : "Actions",
    view: isRtl ? "عرض" : "View",
    edit: isRtl ? "تعديل" : "Edit",
    yes: isRtl ? "نعم" : "Yes",
    no: isRtl ? "لا" : "No",
    draft: isRtl ? "مسودة" : "Draft",
    sent: isRtl ? "مُرسل" : "Sent",
    signed: isRtl ? "موقّع" : "Signed",
    terminated: isRtl ? "منهي" : "Terminated",
    serviceAgreement: isRtl ? "اتفاقية خدمة" : "Service Agreement",
    sla: isRtl ? "اتفاقية مستوى الخدمة" : "SLA",
    dataProcessing: isRtl ? "معالجة بيانات" : "Data Processing",
    custom: isRtl ? "مخصص" : "Custom",
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRtl ? "ar-SA" : "en-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat(isRtl ? "ar-SA" : "en-SA", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredContracts = useMemo(() => {
    if (!contracts) return [];
    return contracts.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && c.type !== typeFilter) return false;
      return true;
    });
  }, [contracts, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    if (!contracts) return { total: 0, active: 0, expiringSoon: 0, expired: 0 };
    return {
      total: contracts.length,
      active: contracts.filter((c) => c.status === "ACTIVE").length,
      expiringSoon: expiringContracts?.length || 0,
      expired: contracts.filter((c) => c.status === "EXPIRED").length,
    };
  }, [contracts, expiringContracts]);

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {texts.loadingError}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/compliance/contracts/new`}>
            <Plus className="me-2 h-4 w-4" />
            {texts.newContract}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.total}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.active}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.expiringSoon}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.expiringSoon}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.expired}</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.filterStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{texts.all}</SelectItem>
                  <SelectItem value="DRAFT">{texts.draft}</SelectItem>
                  <SelectItem value="SENT">{texts.sent}</SelectItem>
                  <SelectItem value="SIGNED">{texts.signed}</SelectItem>
                  <SelectItem value="ACTIVE">{texts.active}</SelectItem>
                  <SelectItem value="EXPIRED">{texts.expired}</SelectItem>
                  <SelectItem value="TERMINATED">{texts.terminated}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as TypeFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.filterType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{texts.all}</SelectItem>
                  <SelectItem value="SERVICE_AGREEMENT">{texts.serviceAgreement}</SelectItem>
                  <SelectItem value="SLA">{texts.sla}</SelectItem>
                  <SelectItem value="DATA_PROCESSING">{texts.dataProcessing}</SelectItem>
                  <SelectItem value="CUSTOM">{texts.custom}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loading />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              {texts.noContracts}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-start text-sm font-medium text-muted-foreground">{texts.contractNumber}</th>
                    <th className="py-3 text-start text-sm font-medium text-muted-foreground">{texts.tenant}</th>
                    <th className="py-3 text-start text-sm font-medium text-muted-foreground">{texts.type}</th>
                    <th className="py-3 text-start text-sm font-medium text-muted-foreground">{texts.status}</th>
                    <th className="py-3 text-start text-sm font-medium text-muted-foreground">{texts.startDate}</th>
                    <th className="py-3 text-start text-sm font-medium text-muted-foreground">{texts.endDate}</th>
                    <th className="py-3 text-end text-sm font-medium text-muted-foreground">{texts.value}</th>
                    <th className="py-3 text-center text-sm font-medium text-muted-foreground">{texts.autoRenew}</th>
                    <th className="py-3 text-end text-sm font-medium text-muted-foreground">{texts.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => {
                    const statusConfig = CONTRACT_STATUS_CONFIG[contract.status];
                    const typeLabel = CONTRACT_TYPE_LABELS[contract.type];
                    return (
                      <tr key={contract.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 font-mono text-sm">{contract.contractNumber}</td>
                        <td className="py-3 text-sm">
                          {isRtl
                            ? contract.tenantNameAr || contract.tenantName || contract.tenantId.slice(0, 8)
                            : contract.tenantName || contract.tenantNameAr || contract.tenantId.slice(0, 8)}
                        </td>
                        <td className="py-3 text-sm">{isRtl ? typeLabel.ar : typeLabel.en}</td>
                        <td className="py-3">
                          <Badge variant={statusConfig.variant}>
                            {isRtl ? statusConfig.labelAr : statusConfig.label}
                          </Badge>
                        </td>
                        <td className="py-3 text-sm">{formatDate(contract.startDate)}</td>
                        <td className="py-3 text-sm">{formatDate(contract.endDate)}</td>
                        <td className="py-3 text-end text-sm">
                          {contract.value && contract.currency
                            ? formatCurrency(contract.value, contract.currency)
                            : "-"}
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant={contract.autoRenew ? "success" : "outline"}>
                            {contract.autoRenew ? texts.yes : texts.no}
                          </Badge>
                        </td>
                        <td className="py-3 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/${locale}/compliance/contracts/${contract.id}`}>
                                <Eye className="me-1 h-3.5 w-3.5" />
                                {texts.view}
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/${locale}/compliance/contracts/${contract.id}/edit`}>
                                <Edit className="me-1 h-3.5 w-3.5" />
                                {texts.edit}
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
