"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Calendar,
  Search,
  LayoutGrid,
  List,
  Archive,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { LocalizedText, useLocalizedText } from "@/components/ui/localized-text";
import { Loading } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassCard } from "@/components/admin/class-card";
import { useToast } from "@/hooks/use-toast";
import {
  useClasses,
  useDeleteClass,
  useActivateClass,
  useDeactivateClass,
} from "@/queries";
import type { GymClass, ClassStatus, DayOfWeek } from "@/types/scheduling";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "table";

export default function ClassesPage() {
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const { toast } = useToast();
  const isRTL = locale === "ar";

  // Filter state
  const [statusFilter, setStatusFilter] = useState<ClassStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);

  // Fetch classes
  const { data, isLoading, error } = useClasses({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    page,
    size: pageSize,
  });

  // Mutations
  const deleteClass = useDeleteClass();
  const activateClass = useActivateClass();
  const deactivateClass = useDeactivateClass();

  const texts = {
    en: {
      title: "Classes",
      description: "Manage your gym classes, schedules, and sessions",
      addClass: "New Class",
      search: "Search classes...",
      status: "Status",
      all: "All",
      active: "Active",
      inactive: "Inactive",
      cancelled: "Archived",
      name: "Name",
      capacity: "Capacity",
      duration: "Duration",
      schedule: "Schedule",
      actions: "Actions",
      view: "View",
      edit: "Edit",
      delete: "Delete",
      activate: "Activate",
      deactivate: "Deactivate",
      archive: "Archive",
      generateSessions: "Generate Sessions",
      noClasses: "No classes found",
      noClassesDesc: "Get started by creating your first class",
      error: "Error loading classes",
      minutes: "min",
      monday: "Mon",
      tuesday: "Tue",
      wednesday: "Wed",
      thursday: "Thu",
      friday: "Fri",
      saturday: "Sat",
      sunday: "Sun",
      deleteConfirm: "Are you sure you want to delete this class?",
      classActivated: "Class activated successfully",
      classDeactivated: "Class deactivated successfully",
      classDeleted: "Class deleted successfully",
      gridView: "Grid view",
      tableView: "Table view",
    },
    ar: {
      title: "الفصول",
      description: "إدارة فصول الجيم والجداول والجلسات",
      addClass: "فصل جديد",
      search: "البحث في الفصول...",
      status: "الحالة",
      all: "الكل",
      active: "نشط",
      inactive: "غير نشط",
      cancelled: "مؤرشف",
      name: "الاسم",
      capacity: "السعة",
      duration: "المدة",
      schedule: "الجدول",
      actions: "الإجراءات",
      view: "عرض",
      edit: "تعديل",
      delete: "حذف",
      activate: "تفعيل",
      deactivate: "تعطيل",
      archive: "أرشفة",
      generateSessions: "إنشاء جلسات",
      noClasses: "لا توجد فصول",
      noClassesDesc: "ابدأ بإنشاء أول فصل لك",
      error: "حدث خطأ أثناء تحميل الفصول",
      minutes: "دقيقة",
      monday: "الإثنين",
      tuesday: "الثلاثاء",
      wednesday: "الأربعاء",
      thursday: "الخميس",
      friday: "الجمعة",
      saturday: "السبت",
      sunday: "الأحد",
      deleteConfirm: "هل أنت متأكد من حذف هذا الفصل؟",
      classActivated: "تم تفعيل الفصل بنجاح",
      classDeactivated: "تم تعطيل الفصل بنجاح",
      classDeleted: "تم حذف الفصل بنجاح",
      gridView: "عرض شبكي",
      tableView: "عرض جدولي",
    },
  };

  const t = texts[locale];

  const dayLabels: Record<DayOfWeek, string> = {
    MONDAY: t.monday,
    TUESDAY: t.tuesday,
    WEDNESDAY: t.wednesday,
    THURSDAY: t.thursday,
    FRIDAY: t.friday,
    SATURDAY: t.saturday,
    SUNDAY: t.sunday,
  };

  // Calculate status counts from all data
  const statusCounts = useMemo(() => {
    // Note: In a real app, you'd want to fetch these counts from a separate endpoint
    // For now, we'll just show the filtered count
    const content = data?.content || [];
    return {
      all: data?.totalElements || 0,
      active: content.filter((c) => c.status === "ACTIVE").length,
      inactive: content.filter((c) => c.status === "INACTIVE").length,
      cancelled: content.filter((c) => c.status === "CANCELLED").length,
    };
  }, [data]);

  // Filter classes by search query (client-side for now)
  const filteredClasses = useMemo(() => {
    const content = data?.content || [];
    if (!searchQuery.trim()) return content;

    const query = searchQuery.toLowerCase();
    return content.filter((gymClass) => {
      const nameEn = gymClass.name.en?.toLowerCase() || "";
      const nameAr = gymClass.name.ar?.toLowerCase() || "";
      return nameEn.includes(query) || nameAr.includes(query);
    });
  }, [data?.content, searchQuery]);

  // Handle status change
  const handleStatusChange = async (
    gymClass: GymClass,
    action: "activate" | "deactivate" | "archive"
  ) => {
    try {
      if (action === "activate") {
        await activateClass.mutateAsync(gymClass.id);
        toast({ title: t.classActivated });
      } else if (action === "deactivate") {
        await deactivateClass.mutateAsync(gymClass.id);
        toast({ title: t.classDeactivated });
      } else if (action === "archive") {
        // Archive is essentially deactivate with cancelled status
        await deactivateClass.mutateAsync(gymClass.id);
        toast({ title: t.classDeactivated });
      }
    } catch {
      toast({ title: t.error, variant: "destructive" });
    }
  };

  // Handle delete
  const handleDelete = async (gymClass: GymClass) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await deleteClass.mutateAsync(gymClass.id);
      toast({ title: t.classDeleted });
    } catch {
      toast({ title: t.error, variant: "destructive" });
    }
  };

  // Table columns
  const columns: ColumnDef<GymClass>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: t.name,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              <LocalizedText text={row.original.name} />
            </p>
            {row.original.trainerName && (
              <p className="text-sm text-muted-foreground">
                <LocalizedText text={row.original.trainerName} />
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "capacity",
        header: t.capacity,
        cell: ({ row }) => row.original.capacity,
      },
      {
        accessorKey: "durationMinutes",
        header: t.duration,
        cell: ({ row }) => (
          <span>
            {row.original.durationMinutes} {t.minutes}
          </span>
        ),
      },
      {
        accessorKey: "schedules",
        header: t.schedule,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {(row.original.schedules ?? []).slice(0, 3).map((schedule, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {dayLabels[schedule.dayOfWeek]} {schedule.startTime.slice(0, 5)}
              </Badge>
            ))}
            {(row.original.schedules ?? []).length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{(row.original.schedules ?? []).length - 3}
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: t.status,
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} locale={locale} />
        ),
      },
      {
        id: "actions",
        header: t.actions,
        cell: ({ row }) => {
          const gymClass = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"}>
                <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => router.push(`/${locale}/classes/${gymClass.id}`)}
                >
                  <Eye className="me-2 h-4 w-4" />
                  {t.view}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/${locale}/classes/${gymClass.id}/edit`)}
                >
                  <Edit className="me-2 h-4 w-4" />
                  {t.edit}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/${locale}/classes/${gymClass.id}/generate-sessions`)
                  }
                >
                  <Calendar className="me-2 h-4 w-4" />
                  {t.generateSessions}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {gymClass.status === "ACTIVE" ? (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(gymClass, "deactivate")}
                  >
                    <Pause className="me-2 h-4 w-4" />
                    {t.deactivate}
                  </DropdownMenuItem>
                ) : gymClass.status === "INACTIVE" ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(gymClass, "activate")}
                    >
                      <Play className="me-2 h-4 w-4" />
                      {t.activate}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleStatusChange(gymClass, "archive")}
                    >
                      <Archive className="me-2 h-4 w-4" />
                      {t.archive}
                    </DropdownMenuItem>
                  </>
                ) : null}
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDelete(gymClass)}
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  {t.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [locale, t, dayLabels, router, isRTL]
  );

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {t.error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href={`/${locale}/classes/new`}>
            <Plus className="h-4 w-4" />
            {t.addClass}
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search and Status Filter */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status Filter (for table view) */}
              {viewMode === "table" && (
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as ClassStatus | "ALL");
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder={t.status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t.all}</SelectItem>
                    <SelectItem value="ACTIVE">{t.active}</SelectItem>
                    <SelectItem value="INACTIVE">{t.inactive}</SelectItem>
                    <SelectItem value="CANCELLED">{t.cancelled}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8"
                title={t.gridView}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8"
                title={t.tableView}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs (for grid view) */}
      {viewMode === "grid" && (
        <Tabs
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as ClassStatus | "ALL");
            setPage(0);
          }}
        >
          <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-4">
            <TabsTrigger
              value="ALL"
              className={cn(
                "rounded-none border-b-2 border-transparent pb-3 pt-2 px-1 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              )}
            >
              {t.all}
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {statusCounts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="ACTIVE"
              className={cn(
                "rounded-none border-b-2 border-transparent pb-3 pt-2 px-1 data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              )}
            >
              {t.active}
              <Badge variant="success" className="ml-2 h-5 px-1.5 text-xs">
                {statusCounts.active}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="INACTIVE"
              className={cn(
                "rounded-none border-b-2 border-transparent pb-3 pt-2 px-1 data-[state=active]:border-slate-400 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              )}
            >
              {t.inactive}
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {statusCounts.inactive}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="CANCELLED"
              className={cn(
                "rounded-none border-b-2 border-transparent pb-3 pt-2 px-1 data-[state=active]:border-red-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              )}
            >
              {t.cancelled}
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                {statusCounts.cancelled}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loading />
        </div>
      ) : filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{t.noClasses}</h3>
            <p className="text-muted-foreground mt-1">{t.noClassesDesc}</p>
            <Button asChild className="mt-4">
              <Link href={`/${locale}/classes/new`}>
                <Plus className="h-4 w-4" />
                {t.addClass}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredClasses.map((gymClass) => (
            <ClassCard
              key={gymClass.id}
              gymClass={gymClass}
              onView={() => router.push(`/${locale}/classes/${gymClass.id}`)}
              onEdit={() => router.push(`/${locale}/classes/${gymClass.id}/edit`)}
              onStatusChange={(action) => handleStatusChange(gymClass, action)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={filteredClasses}
              manualPagination
              pageCount={data?.totalPages || 1}
              pageIndex={page}
              pageSize={pageSize}
              totalRows={data?.totalElements}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Grid Pagination */}
      {viewMode === "grid" && data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            {isRTL ? "→" : "←"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
            disabled={page >= data.totalPages - 1}
          >
            {isRTL ? "←" : "→"}
          </Button>
        </div>
      )}
    </div>
  );
}
