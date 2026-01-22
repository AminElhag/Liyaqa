"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Search, Eye, Edit, Trash2, UserX, UserCheck, X, FileUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { LocalizedText } from "@/components/ui/localized-text";
import { Loading } from "@/components/ui/spinner";
import {
  useMembers,
  useDeleteMember,
  useSuspendMember,
  useActivateMember,
} from "@/queries";
import { useBulkMemberStatus, useBulkMemberDelete } from "@/queries/use-bulk";
import { BulkActionDialog } from "@/components/admin/bulk-action-dialog";
import type { Member, MemberStatus } from "@/types/member";
import type { BulkMemberAction, BulkActionConfig, BulkOperationResponse } from "@/types/bulk";
import { formatDate } from "@/lib/utils";

export default function MembersPage() {
  const locale = useLocale();
  const router = useRouter();

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MemberStatus | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch members
  const { data, isLoading, error } = useMembers({
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    page,
    size: pageSize,
  });

  // Mutations
  const deleteMember = useDeleteMember();
  const suspendMember = useSuspendMember();
  const activateMember = useActivateMember();
  const bulkStatus = useBulkMemberStatus();
  const bulkDelete = useBulkMemberDelete();

  // Bulk operations state
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [currentBulkAction, setCurrentBulkAction] = useState<BulkMemberAction | "DELETE" | null>(null);

  const texts = {
    title: locale === "ar" ? "الأعضاء" : "Members",
    description:
      locale === "ar" ? "إدارة أعضاء النادي" : "Manage your club members",
    addMember: locale === "ar" ? "إضافة عضو" : "Add Member",
    importMembers: locale === "ar" ? "استيراد" : "Import",
    search: locale === "ar" ? "البحث بالاسم أو البريد..." : "Search by name or email...",
    status: locale === "ar" ? "الحالة" : "Status",
    all: locale === "ar" ? "الكل" : "All",
    active: locale === "ar" ? "نشط" : "Active",
    suspended: locale === "ar" ? "موقوف" : "Suspended",
    frozen: locale === "ar" ? "مجمد" : "Frozen",
    name: locale === "ar" ? "الاسم" : "Name",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    phone: locale === "ar" ? "الهاتف" : "Phone",
    joinDate: locale === "ar" ? "تاريخ الانضمام" : "Join Date",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    edit: locale === "ar" ? "تعديل" : "Edit",
    delete: locale === "ar" ? "حذف" : "Delete",
    suspend: locale === "ar" ? "إيقاف" : "Suspend",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    noMembers: locale === "ar" ? "لا يوجد أعضاء" : "No members found",
    error: locale === "ar" ? "حدث خطأ أثناء تحميل الأعضاء" : "Error loading members",
    // Bulk actions
    selected: locale === "ar" ? "محدد" : "selected",
    clearSelection: locale === "ar" ? "إلغاء التحديد" : "Clear",
    bulkSuspend: locale === "ar" ? "إيقاف الأعضاء" : "Suspend Members",
    bulkActivate: locale === "ar" ? "تفعيل الأعضاء" : "Activate Members",
    bulkDelete: locale === "ar" ? "حذف الأعضاء" : "Delete Members",
  };

  // Bulk action configuration
  const getBulkActionConfig = (action: BulkMemberAction | "DELETE" | null): BulkActionConfig => {
    switch (action) {
      case "SUSPEND":
        return {
          entityType: "member",
          action: "SUSPEND",
          labelEn: "Suspend Members",
          labelAr: "إيقاف الأعضاء",
          variant: "warning",
          requiresReason: true,
        };
      case "ACTIVATE":
        return {
          entityType: "member",
          action: "ACTIVATE",
          labelEn: "Activate Members",
          labelAr: "تفعيل الأعضاء",
          variant: "default",
          requiresReason: false,
        };
      case "DELETE":
        return {
          entityType: "member",
          action: "DELETE",
          labelEn: "Delete Members",
          labelAr: "حذف الأعضاء",
          variant: "destructive",
          requiresReason: true,
        };
      default:
        return {
          entityType: "member",
          action: "",
          labelEn: "",
          labelAr: "",
          variant: "default",
        };
    }
  };

  // Handle bulk action
  const openBulkAction = (action: BulkMemberAction | "DELETE") => {
    setCurrentBulkAction(action);
    setBulkDialogOpen(true);
  };

  const handleBulkConfirm = async (options: {
    reason?: string;
    sendNotifications: boolean;
  }): Promise<BulkOperationResponse> => {
    const memberIds = selectedMembers.map((m) => m.id);

    if (currentBulkAction === "DELETE") {
      return await bulkDelete.mutateAsync({
        memberIds,
        reason: options.reason,
      });
    }

    return await bulkStatus.mutateAsync({
      memberIds,
      action: currentBulkAction as BulkMemberAction,
      reason: options.reason,
      sendNotifications: options.sendNotifications,
    });
  };

  // Table columns
  const columns: ColumnDef<Member>[] = useMemo(
    () => [
      {
        accessorKey: "firstName",
        header: texts.name,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              <LocalizedText text={row.original.firstName} />{" "}
              <LocalizedText text={row.original.lastName} />
            </p>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: texts.email,
      },
      {
        accessorKey: "phone",
        header: texts.phone,
      },
      {
        accessorKey: "status",
        header: texts.status,
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} locale={locale} />
        ),
      },
      {
        accessorKey: "createdAt",
        header: texts.joinDate,
        cell: ({ row }) => formatDate(row.original.createdAt, locale),
      },
      {
        id: "actions",
        header: texts.actions,
        cell: ({ row }) => {
          const member = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={locale === "ar" ? "start" : "end"}>
                <DropdownMenuLabel>{texts.actions}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/${locale}/members/${member.id}`)
                  }
                >
                  <Eye className="me-2 h-4 w-4" />
                  {texts.view}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/${locale}/members/${member.id}/edit`)
                  }
                >
                  <Edit className="me-2 h-4 w-4" />
                  {texts.edit}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {member.status === "ACTIVE" ? (
                  <DropdownMenuItem
                    onClick={() => suspendMember.mutate(member.id)}
                  >
                    {texts.suspend}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => activateMember.mutate(member.id)}
                  >
                    {texts.activate}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    if (
                      confirm(
                        locale === "ar"
                          ? "هل أنت متأكد من حذف هذا العضو؟"
                          : "Are you sure you want to delete this member?"
                      )
                    ) {
                      deleteMember.mutate(member.id);
                    }
                  }}
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  {texts.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [locale, texts, router, deleteMember, suspendMember, activateMember]
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
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${locale}/members/import`}>
              <FileUp className="me-2 h-4 w-4" />
              {texts.importMembers}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/members/new`}>
              <Plus className="me-2 h-4 w-4" />
              {texts.addMember}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
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
                setStatusFilter(value as MemberStatus | "ALL");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={texts.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{texts.all}</SelectItem>
                <SelectItem value="ACTIVE">{texts.active}</SelectItem>
                <SelectItem value="SUSPENDED">{texts.suspended}</SelectItem>
                <SelectItem value="FROZEN">{texts.frozen}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Toolbar */}
      {selectedMembers.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">
                {selectedMembers.length} {texts.selected}
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openBulkAction("SUSPEND")}
                >
                  <UserX className="me-2 h-4 w-4" />
                  {texts.bulkSuspend}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openBulkAction("ACTIVATE")}
                >
                  <UserCheck className="me-2 h-4 w-4" />
                  {texts.bulkActivate}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openBulkAction("DELETE")}
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  {texts.bulkDelete}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMembers([])}
                className="ms-auto"
              >
                <X className="me-2 h-4 w-4" />
                {texts.clearSelection}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
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
              enableSelection
              onSelectionChange={setSelectedMembers}
            />
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <BulkActionDialog
        open={bulkDialogOpen}
        onOpenChange={(open) => {
          setBulkDialogOpen(open);
          if (!open) {
            setSelectedMembers([]);
          }
        }}
        config={getBulkActionConfig(currentBulkAction)}
        selectedCount={selectedMembers.length}
        onConfirm={handleBulkConfirm}
        locale={locale}
      />
    </div>
  );
}
