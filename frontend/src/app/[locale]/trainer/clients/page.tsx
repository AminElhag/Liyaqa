"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Search, Users, UserCheck, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Loading } from "@/components/ui/spinner";
import {
  useTrainerClients,
  useClientStats,
} from "@/queries/use-trainer-portal";
import { useMyTrainerProfile } from "@/queries/use-trainers";
import { getClientColumns } from "@/components/trainer/client-columns";
import type { TrainerClientStatus, TrainerClientResponse } from "@/types/trainer-portal";

export default function ClientsPage() {
  const locale = useLocale();
  const router = useRouter();

  // Get trainer profile
  const { data: trainerProfile } = useMyTrainerProfile();
  const trainerId = trainerProfile?.id;

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TrainerClientStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch clients
  const { data: clientsData, isLoading, error } = useTrainerClients({
    trainerId,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    page,
    size: pageSize,
  });

  // Fetch stats
  const { data: stats } = useClientStats(trainerId);

  const texts = {
    title: locale === "ar" ? "إدارة العملاء" : "Client Management",
    description: locale === "ar" ? "عرض وإدارة عملائك وتتبع تقدمهم" : "View and manage your clients and track their progress",
    search: locale === "ar" ? "البحث بالاسم أو البريد الإلكتروني..." : "Search by name or email...",
    status: locale === "ar" ? "الحالة" : "Status",
    all: locale === "ar" ? "الكل" : "All",
    active: locale === "ar" ? "نشط" : "Active",
    onHold: locale === "ar" ? "معلق" : "On Hold",
    completed: locale === "ar" ? "مكتمل" : "Completed",
    inactive: locale === "ar" ? "غير نشط" : "Inactive",
    noClients: locale === "ar" ? "لا يوجد عملاء" : "No clients found",
    error: locale === "ar" ? "حدث خطأ أثناء تحميل العملاء" : "Error loading clients",
    // Stats cards
    totalClients: locale === "ar" ? "إجمالي العملاء" : "Total Clients",
    activeClients: locale === "ar" ? "العملاء النشطين" : "Active Clients",
    newThisMonth: locale === "ar" ? "جدد هذا الشهر" : "New This Month",
  };

  // Handlers
  const handleView = (client: TrainerClientResponse) => {
    router.push(`/${locale}/trainer/clients/${client.id}`);
  };

  const handleEdit = (client: TrainerClientResponse) => {
    router.push(`/${locale}/trainer/clients/${client.id}/edit`);
  };

  // Columns
  const columns = getClientColumns({
    locale,
    onView: handleView,
    onEdit: handleEdit,
  });

  // Filter clients by search (client-side filtering for name/email)
  const filteredData = clientsData?.content?.filter((client) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      client.memberName?.toLowerCase().includes(searchLower) ||
      client.memberEmail?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">{texts.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{texts.title}</h1>
        <p className="text-muted-foreground">{texts.description}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{texts.totalClients}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{texts.activeClients}</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.activeClients || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{texts.newThisMonth}</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.newThisMonth || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={texts.search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ps-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as TrainerClientStatus | "ALL");
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={texts.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{texts.all}</SelectItem>
                  <SelectItem value="ACTIVE">{texts.active}</SelectItem>
                  <SelectItem value="ON_HOLD">{texts.onHold}</SelectItem>
                  <SelectItem value="COMPLETED">{texts.completed}</SelectItem>
                  <SelectItem value="INACTIVE">{texts.inactive}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredData || []}
            manualPagination
            pageCount={clientsData?.totalPages || 1}
            pageIndex={page}
            pageSize={pageSize}
            totalRows={clientsData?.totalElements}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
