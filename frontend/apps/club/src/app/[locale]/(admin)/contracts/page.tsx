"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@liyaqa/shared/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { Spinner, Loading } from "@liyaqa/shared/components/ui/spinner";
import { useContracts, useApproveContract, useVoidContract } from "@liyaqa/shared/queries/use-admin-contracts";
import { ContractStatus, ContractType, ContractTerm, AdminContractsFilter, ContractListItem } from "@liyaqa/shared/types/contract";
import { toast } from "sonner";

export default function ContractsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  // Filter state
  const [filter, setFilter] = useState<AdminContractsFilter>({
    page: 0,
    size: 10,
  });
  const [searchInput, setSearchInput] = useState("");

  // Queries
  const { data: contractsPage, isLoading } = useContracts(filter);

  // Mutations
  const approveMutation = useApproveContract();
  const voidMutation = useVoidContract();

  const handleSearch = () => {
    setFilter((prev) => ({ ...prev, memberSearch: searchInput, page: 0 }));
  };

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success(isArabic ? "تمت الموافقة على العقد" : "Contract approved");
    } catch {
      toast.error(isArabic ? "فشل في الموافقة" : "Failed to approve");
    }
  };

  const handleVoid = async (id: string) => {
    try {
      await voidMutation.mutateAsync({ id, reason: "Admin action" });
      toast.success(isArabic ? "تم إلغاء العقد" : "Contract voided");
    } catch {
      toast.error(isArabic ? "فشل في الإلغاء" : "Failed to void");
    }
  };

  const getStatusBadge = (status: ContractStatus) => {
    const config: Record<ContractStatus, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; labelEn: string; labelAr: string }> = {
      PENDING_SIGNATURE: { variant: "outline", icon: <Clock className="h-3 w-3" />, labelEn: "Pending Signature", labelAr: "في انتظار التوقيع" },
      ACTIVE: { variant: "default", icon: <CheckCircle className="h-3 w-3" />, labelEn: "Active", labelAr: "نشط" },
      IN_NOTICE_PERIOD: { variant: "secondary", icon: <AlertTriangle className="h-3 w-3" />, labelEn: "Notice Period", labelAr: "فترة الإشعار" },
      CANCELLED: { variant: "destructive", icon: <XCircle className="h-3 w-3" />, labelEn: "Cancelled", labelAr: "ملغي" },
      EXPIRED: { variant: "secondary", icon: <Clock className="h-3 w-3" />, labelEn: "Expired", labelAr: "منتهي" },
      SUSPENDED: { variant: "destructive", icon: <AlertTriangle className="h-3 w-3" />, labelEn: "Suspended", labelAr: "معلق" },
      VOIDED: { variant: "destructive", icon: <XCircle className="h-3 w-3" />, labelEn: "Voided", labelAr: "ملغى" },
    };

    const c = config[status];
    return (
      <Badge variant={c.variant} className="gap-1">
        {c.icon}
        {isArabic ? c.labelAr : c.labelEn}
      </Badge>
    );
  };

  const getContractTermLabel = (term: ContractTerm) => {
    const labels: Record<ContractTerm, { en: string; ar: string }> = {
      MONTHLY: { en: "Monthly", ar: "شهري" },
      QUARTERLY: { en: "Quarterly", ar: "ربع سنوي" },
      SEMI_ANNUAL: { en: "Semi-Annual", ar: "نصف سنوي" },
      ANNUAL: { en: "Annual", ar: "سنوي" },
    };
    return isArabic ? labels[term].ar : labels[term].en;
  };

  const texts = {
    title: isArabic ? "إدارة العقود" : "Contract Management",
    description: isArabic ? "إدارة عقود الأعضاء" : "Manage member contracts",
    search: isArabic ? "البحث عن عضو..." : "Search members...",
    status: isArabic ? "الحالة" : "Status",
    all: isArabic ? "الكل" : "All",
    contractNumber: isArabic ? "رقم العقد" : "Contract #",
    member: isArabic ? "العضو" : "Member",
    plan: isArabic ? "الباقة" : "Plan",
    term: isArabic ? "المدة" : "Term",
    monthlyFee: isArabic ? "الرسوم الشهرية" : "Monthly Fee",
    startDate: isArabic ? "تاريخ البدء" : "Start Date",
    actions: isArabic ? "الإجراءات" : "Actions",
    view: isArabic ? "عرض" : "View",
    approve: isArabic ? "موافقة" : "Approve",
    void: isArabic ? "إلغاء" : "Void",
    noContracts: isArabic ? "لا توجد عقود" : "No contracts found",
    coolingOff: isArabic ? "فترة التراجع" : "Cooling Off",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>{texts.title}</CardTitle>
          </div>
          <CardDescription>{texts.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder={texts.search}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="max-w-sm"
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <Select
              value={filter.status || "ALL"}
              onValueChange={(v) =>
                setFilter((prev) => ({
                  ...prev,
                  status: v === "ALL" ? undefined : (v as ContractStatus),
                  page: 0,
                }))
              }
            >
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 me-2" />
                <SelectValue placeholder={texts.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{texts.all}</SelectItem>
                <SelectItem value="PENDING_SIGNATURE">
                  {isArabic ? "في انتظار التوقيع" : "Pending Signature"}
                </SelectItem>
                <SelectItem value="ACTIVE">
                  {isArabic ? "نشط" : "Active"}
                </SelectItem>
                <SelectItem value="IN_NOTICE_PERIOD">
                  {isArabic ? "فترة الإشعار" : "Notice Period"}
                </SelectItem>
                <SelectItem value="CANCELLED">
                  {isArabic ? "ملغي" : "Cancelled"}
                </SelectItem>
                <SelectItem value="EXPIRED">
                  {isArabic ? "منتهي" : "Expired"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {contractsPage?.content.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{texts.noContracts}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{texts.contractNumber}</TableHead>
                    <TableHead>{texts.member}</TableHead>
                    <TableHead>{texts.plan}</TableHead>
                    <TableHead>{texts.term}</TableHead>
                    <TableHead>{texts.monthlyFee}</TableHead>
                    <TableHead>{texts.startDate}</TableHead>
                    <TableHead>{texts.status}</TableHead>
                    <TableHead className="text-right">{texts.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractsPage?.content.map((contract: ContractListItem) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-mono text-sm">
                        {contract.contractNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.memberName}</p>
                          <p className="text-sm text-muted-foreground">
                            {contract.memberEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{contract.planName}</TableCell>
                      <TableCell>
                        {getContractTermLabel(contract.contractTerm)}
                      </TableCell>
                      <TableCell>
                        {contract.lockedMonthlyFee} {contract.lockedCurrency}
                      </TableCell>
                      <TableCell>
                        {new Date(contract.startDate).toLocaleDateString(
                          isArabic ? "ar-SA" : undefined
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(contract.status)}
                          {contract.isWithinCoolingOff && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                              {texts.coolingOff}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/${locale}/contracts/${contract.id}`}>
                                {texts.view}
                              </Link>
                            </DropdownMenuItem>
                            {contract.status === "PENDING_SIGNATURE" && (
                              <DropdownMenuItem
                                onClick={() => handleApprove(contract.id)}
                                disabled={approveMutation.isPending}
                              >
                                {texts.approve}
                              </DropdownMenuItem>
                            )}
                            {contract.status === "ACTIVE" && (
                              <DropdownMenuItem
                                onClick={() => handleVoid(contract.id)}
                                className="text-destructive"
                                disabled={voidMutation.isPending}
                              >
                                {texts.void}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {contractsPage && contractsPage.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? `${contractsPage.totalElements} عقد`
                  : `${contractsPage.totalElements} contracts`}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilter((prev) => ({
                      ...prev,
                      page: Math.max(0, (prev.page || 0) - 1),
                    }))
                  }
                  disabled={filter.page === 0}
                >
                  {isArabic ? "السابق" : "Previous"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilter((prev) => ({
                      ...prev,
                      page: (prev.page || 0) + 1,
                    }))
                  }
                  disabled={(filter.page || 0) >= contractsPage.totalPages - 1}
                >
                  {isArabic ? "التالي" : "Next"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
