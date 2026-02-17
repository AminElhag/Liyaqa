"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Plus, Search, Users, Dumbbell, UserX, Briefcase } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useTrainers,
  useActivateTrainer,
  useDeactivateTrainer,
  useSetTrainerOnLeave,
} from "@liyaqa/shared/queries/use-trainers";
import { getTrainerColumns } from "@/components/admin/trainer-columns";
import type { TrainerStatus, TrainerSummary } from "@liyaqa/shared/types/trainer";

export default function TrainersPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TrainerStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Track which trainer has a pending action
  const [pendingTrainerId, setPendingTrainerId] = useState<string | null>(null);

  // Fetch trainers
  const { data, isLoading, error } = useTrainers({
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    page,
    size: pageSize,
  });

  // Mutations
  const activateTrainer = useActivateTrainer();
  const deactivateTrainer = useDeactivateTrainer();
  const setOnLeave = useSetTrainerOnLeave();

  const texts = {
    title: locale === "ar" ? "المدربين" : "Trainers",
    description: locale === "ar" ? "إدارة مدربي النادي" : "Manage your club trainers",
    addTrainer: locale === "ar" ? "إضافة مدرب" : "Add Trainer",
    search: locale === "ar" ? "البحث بالاسم..." : "Search by name...",
    status: locale === "ar" ? "الحالة" : "Status",
    all: locale === "ar" ? "الكل" : "All",
    active: locale === "ar" ? "نشط" : "Active",
    inactive: locale === "ar" ? "غير نشط" : "Inactive",
    onLeave: locale === "ar" ? "في إجازة" : "On Leave",
    terminated: locale === "ar" ? "منهي" : "Terminated",
    noTrainers: locale === "ar" ? "لا يوجد مدربين" : "No trainers found",
    error: locale === "ar" ? "حدث خطأ أثناء تحميل المدربين" : "Error loading trainers",
    // Stats cards
    totalTrainers: locale === "ar" ? "إجمالي المدربين" : "Total Trainers",
    activeTrainers: locale === "ar" ? "المدربين النشطين" : "Active Trainers",
    onLeaveTrainers: locale === "ar" ? "في إجازة" : "On Leave",
    inactiveTrainers: locale === "ar" ? "غير نشطين" : "Inactive",
    // Toast messages
    activatedSuccess: locale === "ar" ? "تم تفعيل المدرب بنجاح" : "Trainer activated successfully",
    deactivatedSuccess: locale === "ar" ? "تم إلغاء تفعيل المدرب بنجاح" : "Trainer deactivated successfully",
    onLeaveSuccess: locale === "ar" ? "تم وضع المدرب في إجازة بنجاح" : "Trainer set on leave successfully",
    actionError: locale === "ar" ? "حدث خطأ أثناء تنفيذ العملية" : "Error performing action",
    clearFilters: locale === "ar" ? "مسح الفلاتر" : "Clear filters",
  };

  // Calculate stats from current page data
  const stats = {
    total: data?.totalElements || 0,
    active: data?.content?.filter((t) => t.status === "ACTIVE").length || 0,
    onLeave: data?.content?.filter((t) => t.status === "ON_LEAVE").length || 0,
    inactive: data?.content?.filter((t) => t.status === "INACTIVE").length || 0,
  };

  // Handlers
  const handleView = (trainer: TrainerSummary) => {
    router.push(`/${locale}/trainers/${trainer.id}`);
  };

  const handleEdit = (trainer: TrainerSummary) => {
    router.push(`/${locale}/trainers/${trainer.id}/edit`);
  };

  const handleActivate = (trainer: TrainerSummary) => {
    setPendingTrainerId(trainer.id);
    activateTrainer.mutate(trainer.id, {
      onSuccess: () => {
        toast({ title: texts.activatedSuccess });
        setPendingTrainerId(null);
      },
      onError: () => {
        toast({ title: texts.actionError, variant: "destructive" });
        setPendingTrainerId(null);
      },
    });
  };

  const handleDeactivate = (trainer: TrainerSummary) => {
    setPendingTrainerId(trainer.id);
    deactivateTrainer.mutate(trainer.id, {
      onSuccess: () => {
        toast({ title: texts.deactivatedSuccess });
        setPendingTrainerId(null);
      },
      onError: () => {
        toast({ title: texts.actionError, variant: "destructive" });
        setPendingTrainerId(null);
      },
    });
  };

  const handleSetOnLeave = (trainer: TrainerSummary) => {
    setPendingTrainerId(trainer.id);
    setOnLeave.mutate(trainer.id, {
      onSuccess: () => {
        toast({ title: texts.onLeaveSuccess });
        setPendingTrainerId(null);
      },
      onError: () => {
        toast({ title: texts.actionError, variant: "destructive" });
        setPendingTrainerId(null);
      },
    });
  };

  // Columns
  const columns = getTrainerColumns({
    locale,
    onView: handleView,
    onEdit: handleEdit,
    onActivate: handleActivate,
    onDeactivate: handleDeactivate,
    onSetOnLeave: handleSetOnLeave,
    pendingTrainerId,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/trainers/new`}>
            <Plus className="me-2 h-4 w-4" />
            {texts.addTrainer}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{texts.totalTrainers}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{texts.activeTrainers}</CardTitle>
            <Dumbbell className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{texts.onLeaveTrainers}</CardTitle>
            <Briefcase className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.onLeave}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{texts.inactiveTrainers}</CardTitle>
            <UserX className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-500">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={texts.search}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="ps-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as TrainerStatus | "ALL");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={texts.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{texts.all}</SelectItem>
                <SelectItem value="ACTIVE">{texts.active}</SelectItem>
                <SelectItem value="INACTIVE">{texts.inactive}</SelectItem>
                <SelectItem value="ON_LEAVE">{texts.onLeave}</SelectItem>
                <SelectItem value="TERMINATED">{texts.terminated}</SelectItem>
              </SelectContent>
            </Select>
            {(search || statusFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setPage(0);
                }}
              >
                {texts.clearFilters}
              </Button>
            )}
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
          ) : error ? (
            <div className="py-10 text-center text-destructive">{texts.error}</div>
          ) : !data?.content || data.content.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{texts.noTrainers}</p>
              {(search || statusFilter !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                    setPage(0);
                  }}
                >
                  {texts.clearFilters}
                </Button>
              )}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={data.content}
              manualPagination
              pageCount={data.totalPages || 1}
              pageIndex={page}
              pageSize={pageSize}
              totalRows={data.totalElements}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
