"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, LayoutGrid, List } from "lucide-react";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@liyaqa/shared/components/ui/tabs";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { KanbanBoard } from "@liyaqa/shared/components/platform/kanban-board";
import { LoseDealDialog } from "@liyaqa/shared/components/platform/lose-deal-dialog";
import { getDealColumns, SOURCE_LABELS } from "@liyaqa/shared/components/platform/deal-columns";
import {
  useDeals,
  useAdvanceDeal,
  useLoseDeal,
  useDeleteDeal,
} from "@liyaqa/shared/queries/platform/use-deals";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import type { DealSummary, DealStatus, DealSource } from "@liyaqa/shared/types/platform";

export default function DealsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuthStore();

  // Check if user can edit (PLATFORM_ADMIN or SALES_REP)
  const canEdit = user?.role === "PLATFORM_ADMIN" || user?.role === "SALES_REP";

  // View state
  const [view, setView] = useState<"table" | "kanban">("kanban");

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DealStatus | "ALL">("ALL");
  const [sourceFilter, setSourceFilter] = useState<DealSource | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Lose deal dialog state
  const [loseDealDialogOpen, setLoseDealDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealSummary | null>(null);

  // Fetch deals for table view
  const { data, isLoading, error } = useDeals({
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    source: sourceFilter !== "ALL" ? sourceFilter : undefined,
    page,
    size: pageSize,
  });

  // Mutations
  const advanceDeal = useAdvanceDeal();
  const loseDeal = useLoseDeal();
  const deleteDeal = useDeleteDeal();

  const texts = {
    title: locale === "ar" ? "الصفقات" : "Deals",
    description:
      locale === "ar" ? "إدارة مسار المبيعات الخاص بك" : "Manage your sales pipeline",
    addDeal: locale === "ar" ? "صفقة جديدة" : "New Deal",
    search: locale === "ar" ? "البحث بالعنوان أو الشركة..." : "Search by title or company...",
    status: locale === "ar" ? "الحالة" : "Status",
    source: locale === "ar" ? "المصدر" : "Source",
    all: locale === "ar" ? "الكل" : "All",
    lead: locale === "ar" ? "عميل محتمل" : "Lead",
    contacted: locale === "ar" ? "تم التواصل" : "Contacted",
    demoScheduled: locale === "ar" ? "عرض مجدول" : "Demo Scheduled",
    demoDone: locale === "ar" ? "تم العرض" : "Demo Done",
    proposalSent: locale === "ar" ? "تم إرسال العرض" : "Proposal Sent",
    negotiation: locale === "ar" ? "تفاوض" : "Negotiation",
    won: locale === "ar" ? "تم الفوز" : "Won",
    lost: locale === "ar" ? "خسارة" : "Lost",
    tableView: locale === "ar" ? "جدول" : "Table",
    kanbanView: locale === "ar" ? "كانبان" : "Kanban",
    noDeals: locale === "ar" ? "لا توجد صفقات" : "No deals found",
    error: locale === "ar" ? "حدث خطأ أثناء تحميل الصفقات" : "Error loading deals",
    deleteConfirm:
      locale === "ar"
        ? "هل أنت متأكد من حذف هذه الصفقة؟"
        : "Are you sure you want to delete this deal?",
  };

  // Column handlers
  const handleView = (deal: DealSummary) => {
    router.push(`/${locale}/deals/${deal.id}`);
  };

  const handleEdit = (deal: DealSummary) => {
    router.push(`/${locale}/deals/${deal.id}/edit`);
  };

  const handleAdvance = (deal: DealSummary) => {
    advanceDeal.mutate(deal.id);
  };

  const handleLose = (deal: DealSummary) => {
    setSelectedDeal(deal);
    setLoseDealDialogOpen(true);
  };

  const handleConfirmLose = (data: { reasonEn: string; reasonAr?: string }) => {
    if (selectedDeal) {
      loseDeal.mutate(
        { id: selectedDeal.id, data },
        {
          onSuccess: () => {
            setLoseDealDialogOpen(false);
            setSelectedDeal(null);
          },
        }
      );
    }
  };

  const handleDelete = (deal: DealSummary) => {
    if (confirm(texts.deleteConfirm)) {
      deleteDeal.mutate(deal.id);
    }
  };

  // Table columns
  const columns = useMemo(
    () =>
      getDealColumns({
        locale,
        onView: handleView,
        onEdit: handleEdit,
        onAdvance: handleAdvance,
        onLose: handleLose,
        onDelete: handleDelete,
        canEdit,
      }),
    [locale, canEdit]
  );

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {texts.error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href={`/${locale}/deals/new`}>
              <Plus className="me-2 h-4 w-4" />
              {texts.addDeal}
            </Link>
          </Button>
        )}
      </div>

      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as "table" | "kanban")}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              {texts.kanbanView}
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <List className="h-4 w-4" />
              {texts.tableView}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Filters (only for table view) */}
        {view === "table" && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={texts.search}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(0);
                    }}
                    className="ps-9"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as DealStatus | "ALL");
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder={texts.status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{texts.all}</SelectItem>
                    <SelectItem value="LEAD">{texts.lead}</SelectItem>
                    <SelectItem value="CONTACTED">{texts.contacted}</SelectItem>
                    <SelectItem value="DEMO_SCHEDULED">{texts.demoScheduled}</SelectItem>
                    <SelectItem value="DEMO_DONE">{texts.demoDone}</SelectItem>
                    <SelectItem value="PROPOSAL_SENT">{texts.proposalSent}</SelectItem>
                    <SelectItem value="NEGOTIATION">{texts.negotiation}</SelectItem>
                    <SelectItem value="WON">{texts.won}</SelectItem>
                    <SelectItem value="LOST">{texts.lost}</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sourceFilter}
                  onValueChange={(value) => {
                    setSourceFilter(value as DealSource | "ALL");
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder={texts.source} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{texts.all}</SelectItem>
                    {Object.entries(SOURCE_LABELS).map(([key, labels]) => (
                      <SelectItem key={key} value={key}>
                        {locale === "ar" ? labels.ar : labels.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kanban View */}
        <TabsContent value="kanban" className="mt-4">
          <KanbanBoard onDealClick={handleView} />
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loading />
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={data?.content || []}
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lose Deal Dialog */}
      <LoseDealDialog
        deal={selectedDeal}
        open={loseDealDialogOpen}
        onOpenChange={setLoseDealDialogOpen}
        onConfirm={handleConfirmLose}
        isLoading={loseDeal.isPending}
      />
    </div>
  );
}
