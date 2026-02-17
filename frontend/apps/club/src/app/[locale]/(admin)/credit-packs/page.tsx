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
  Search,
  Gift,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { StatusBadge } from "@liyaqa/shared/components/ui/status-badge";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useClassPacks,
  useDeleteClassPack,
  useActivateClassPack,
  useDeactivateClassPack,
} from "@liyaqa/shared/queries";
import type { ClassPack, ClassPackStatus, ServiceType } from "@liyaqa/shared/types/scheduling";
import { GrantPackToMemberDialog } from "@/components/admin/grant-pack-to-member-dialog";

const SERVICE_TYPE_TABS: Array<{ value: ServiceType | "ALL"; labelEn: string; labelAr: string }> = [
  { value: "ALL", labelEn: "All", labelAr: "الكل" },
  { value: "GX", labelEn: "GX", labelAr: "تمارين جماعية" },
  { value: "PT", labelEn: "PT", labelAr: "تدريب شخصي" },
  { value: "GOODS", labelEn: "Goods", labelAr: "منتجات" },
];

const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
  GX: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  PT: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  GOODS: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

export default function CreditPacksPage() {
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const { toast } = useToast();
  const isRTL = locale === "ar";

  // Filter state
  const [statusFilter, setStatusFilter] = useState<ClassPackStatus | "ALL">("ALL");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [grantPack, setGrantPack] = useState<ClassPack | null>(null);

  // Fetch class packs with serviceType filter
  const { data, isLoading, error } = useClassPacks({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    serviceType: serviceTypeFilter !== "ALL" ? serviceTypeFilter : undefined,
    page,
    size: pageSize,
  });

  // Mutations
  const deletePack = useDeleteClassPack();
  const activatePack = useActivateClassPack();
  const deactivatePack = useDeactivateClassPack();

  const texts = {
    en: {
      title: "Credit Packs",
      description: "Manage credit bundles for group exercise, personal training, and goods",
      addPack: "Create Pack",
      search: "Search credit packs...",
      status: "Status",
      all: "All",
      active: "Active",
      inactive: "Inactive",
      name: "Name",
      serviceType: "Service Type",
      credits: "Credits",
      price: "Price",
      validity: "Validity",
      sortOrder: "Sort",
      actions: "Actions",
      view: "View",
      edit: "Edit",
      delete: "Delete",
      activate: "Activate",
      deactivate: "Deactivate",
      noPacks: "No credit packs found",
      noPacksDesc: "Get started by creating your first credit pack",
      error: "Error loading credit packs",
      days: "days",
      noExpiry: "No expiry",
      packActivated: "Credit pack activated successfully",
      packDeactivated: "Credit pack deactivated successfully",
      packDeleted: "Credit pack deleted successfully",
      deleteConfirm: "Are you sure you want to delete this credit pack?",
      classes: "credits",
      assignToMember: "Assign to Member",
    },
    ar: {
      title: "باقات الرصيد",
      description: "إدارة باقات الرصيد للتمارين الجماعية والتدريب الشخصي والمنتجات",
      addPack: "إنشاء باقة",
      search: "البحث في باقات الرصيد...",
      status: "الحالة",
      all: "الكل",
      active: "نشط",
      inactive: "غير نشط",
      name: "الاسم",
      serviceType: "نوع الخدمة",
      credits: "الرصيد",
      price: "السعر",
      validity: "الصلاحية",
      sortOrder: "الترتيب",
      actions: "الإجراءات",
      view: "عرض",
      edit: "تعديل",
      delete: "حذف",
      activate: "تفعيل",
      deactivate: "تعطيل",
      noPacks: "لا توجد باقات رصيد",
      noPacksDesc: "ابدأ بإنشاء أول باقة رصيد",
      error: "حدث خطأ أثناء تحميل الباقات",
      days: "أيام",
      noExpiry: "بدون انتهاء",
      packActivated: "تم تفعيل الباقة بنجاح",
      packDeactivated: "تم تعطيل الباقة بنجاح",
      packDeleted: "تم حذف الباقة بنجاح",
      deleteConfirm: "هل أنت متأكد من حذف هذه الباقة؟",
      classes: "رصيد",
      assignToMember: "تعيين لعضو",
    },
  };

  const t = texts[locale];

  // Filter packs by search query (client-side)
  const filteredPacks = useMemo(() => {
    const content = data?.content || [];
    if (!searchQuery.trim()) return content;

    const query = searchQuery.toLowerCase();
    return content.filter((pack) => {
      const nameEn = pack.name.en?.toLowerCase() || "";
      const nameAr = pack.name.ar?.toLowerCase() || "";
      return nameEn.includes(query) || nameAr.includes(query);
    });
  }, [data?.content, searchQuery]);

  // Handle status change
  const handleStatusChange = async (pack: ClassPack, action: "activate" | "deactivate") => {
    try {
      if (action === "activate") {
        await activatePack.mutateAsync(pack.id);
        toast({ title: t.packActivated });
      } else {
        await deactivatePack.mutateAsync(pack.id);
        toast({ title: t.packDeactivated });
      }
    } catch {
      toast({ title: t.error, variant: "destructive" });
    }
  };

  // Handle delete
  const handleDelete = async (pack: ClassPack) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await deletePack.mutateAsync(pack.id);
      toast({ title: t.packDeleted });
    } catch {
      toast({ title: t.error, variant: "destructive" });
    }
  };

  // Format price
  const formatPrice = (price: { amount: number; currency: string }) => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: price.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price.amount);
  };

  // Table columns
  const columns: ColumnDef<ClassPack>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: t.name,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              <LocalizedText text={row.original.name} />
            </p>
            {row.original.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                <LocalizedText text={row.original.description} />
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "serviceType",
        header: t.serviceType,
        cell: ({ row }) => {
          const st = row.original.serviceType;
          return (
            <Badge
              variant="secondary"
              className={SERVICE_TYPE_COLORS[st] || ""}
            >
              {st}
            </Badge>
          );
        },
      },
      {
        accessorKey: "classCount",
        header: t.credits,
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.classCount} {t.classes}
          </Badge>
        ),
      },
      {
        accessorKey: "price",
        header: t.price,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{formatPrice(row.original.price)}</p>
            <p className="text-xs text-muted-foreground">
              {formatPrice(row.original.priceWithTax)} (incl. tax)
            </p>
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
        accessorKey: "sortOrder",
        header: t.sortOrder,
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {row.original.sortOrder}
          </span>
        ),
      },
      {
        id: "actions",
        header: t.actions,
        cell: ({ row }) => {
          const pack = row.original;
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
                  onClick={() => router.push(`/${locale}/credit-packs/${pack.id}`)}
                >
                  <Eye className="me-2 h-4 w-4" />
                  {t.view}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`/${locale}/credit-packs/${pack.id}/edit`)}
                >
                  <Edit className="me-2 h-4 w-4" />
                  {t.edit}
                </DropdownMenuItem>
                {pack.status === "ACTIVE" && (
                  <DropdownMenuItem onClick={() => setGrantPack(pack)}>
                    <Gift className="me-2 h-4 w-4" />
                    {t.assignToMember}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {pack.status === "ACTIVE" ? (
                  <DropdownMenuItem onClick={() => handleStatusChange(pack, "deactivate")}>
                    <Pause className="me-2 h-4 w-4" />
                    {t.deactivate}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleStatusChange(pack, "activate")}>
                    <Play className="me-2 h-4 w-4" />
                    {t.activate}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDelete(pack)}
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
    [locale, t, router, isRTL]
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
          <Link href={`/${locale}/credit-packs/new`}>
            <Plus className="h-4 w-4" />
            {t.addPack}
          </Link>
        </Button>
      </div>

      {/* Service Type Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {SERVICE_TYPE_TABS.map((tab) => {
          const isActive = serviceTypeFilter === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setServiceTypeFilter(tab.value);
                setPage(0);
              }}
              className={
                "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors " +
                (isActive
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80")
              }
            >
              {locale === "ar" ? tab.labelAr : tab.labelEn}
            </button>
          );
        })}
      </div>

      {/* Search and Status Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as ClassPackStatus | "ALL");
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
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loading />
        </div>
      ) : filteredPacks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">{t.noPacks}</h3>
            <p className="text-muted-foreground mt-1">{t.noPacksDesc}</p>
            <Button asChild className="mt-4">
              <Link href={`/${locale}/credit-packs/new`}>
                <Plus className="h-4 w-4" />
                {t.addPack}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={filteredPacks}
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

      {/* Grant Pack to Member Dialog */}
      {grantPack && (
        <GrantPackToMemberDialog
          open={!!grantPack}
          onOpenChange={(open) => {
            if (!open) setGrantPack(null);
          }}
          classPack={grantPack}
          locale={locale}
        />
      )}
    </div>
  );
}
