"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  Search,
  Eye,
  Snowflake,
  Sun,
  XCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  useSubscriptions,
  useFreezeSubscription,
  useUnfreezeSubscription,
  useCancelSubscription,
  useRenewSubscription,
} from "@liyaqa/shared/queries";
import type { Subscription, SubscriptionStatus } from "@liyaqa/shared/types/member";
import { formatDate } from "@liyaqa/shared/utils";

export default function SubscriptionsPage() {
  const locale = useLocale();
  const router = useRouter();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "ALL">(
    "ALL"
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch subscriptions
  const { data, isLoading, error } = useSubscriptions({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    page,
    size: pageSize,
  });

  // Mutations
  const freezeSubscription = useFreezeSubscription();
  const unfreezeSubscription = useUnfreezeSubscription();
  const cancelSubscription = useCancelSubscription();
  const renewSubscription = useRenewSubscription();

  const texts = {
    title: locale === "ar" ? "الاشتراكات" : "Subscriptions",
    description:
      locale === "ar"
        ? "إدارة اشتراكات الأعضاء"
        : "Manage member subscriptions",
    addSubscription: locale === "ar" ? "إضافة اشتراك" : "Add Subscription",
    status: locale === "ar" ? "الحالة" : "Status",
    all: locale === "ar" ? "الكل" : "All",
    active: locale === "ar" ? "نشط" : "Active",
    frozen: locale === "ar" ? "مجمد" : "Frozen",
    cancelled: locale === "ar" ? "ملغى" : "Cancelled",
    expired: locale === "ar" ? "منتهي" : "Expired",
    pending: locale === "ar" ? "قيد الانتظار" : "Pending",
    member: locale === "ar" ? "العضو" : "Member",
    plan: locale === "ar" ? "الخطة" : "Plan",
    startDate: locale === "ar" ? "تاريخ البدء" : "Start Date",
    endDate: locale === "ar" ? "تاريخ الانتهاء" : "End Date",
    remaining: locale === "ar" ? "المتبقي" : "Remaining",
    classes: locale === "ar" ? "حصص" : "classes",
    unlimited: locale === "ar" ? "غير محدود" : "Unlimited",
    actions: locale === "ar" ? "الإجراءات" : "Actions",
    view: locale === "ar" ? "عرض" : "View",
    freeze: locale === "ar" ? "تجميد" : "Freeze",
    unfreeze: locale === "ar" ? "إلغاء التجميد" : "Unfreeze",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    renew: locale === "ar" ? "تجديد" : "Renew",
    noSubscriptions:
      locale === "ar" ? "لا توجد اشتراكات" : "No subscriptions found",
    error:
      locale === "ar"
        ? "حدث خطأ أثناء تحميل الاشتراكات"
        : "Error loading subscriptions",
  };

  // Table columns
  const columns: ColumnDef<Subscription>[] = useMemo(
    () => [
      {
        accessorKey: "memberId",
        header: texts.member,
        cell: ({ row }) => (
          <Link
            href={`/${locale}/members/${row.original.memberId}`}
            className="font-medium hover:underline"
          >
            {locale === "ar" ? "عرض العضو" : "View Member"}
          </Link>
        ),
      },
      {
        accessorKey: "planName",
        header: texts.plan,
        cell: ({ row }) => (
          row.original.planName ? (
            <LocalizedText text={row.original.planName} />
          ) : (
            <span className="text-muted-foreground">
              {locale === "ar" ? "اشتراك" : "Subscription"}
            </span>
          )
        ),
      },
      {
        accessorKey: "status",
        header: texts.status,
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} locale={locale} />
        ),
      },
      {
        accessorKey: "startDate",
        header: texts.startDate,
        cell: ({ row }) => formatDate(row.original.startDate, locale),
      },
      {
        accessorKey: "endDate",
        header: texts.endDate,
        cell: ({ row }) => formatDate(row.original.endDate, locale),
      },
      {
        accessorKey: "classesRemaining",
        header: texts.remaining,
        cell: ({ row }) =>
          row.original.classesRemaining !== undefined
            ? `${row.original.classesRemaining} ${texts.classes}`
            : texts.unlimited,
      },
      {
        id: "actions",
        header: texts.actions,
        cell: ({ row }) => {
          const subscription = row.original;
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
                    router.push(`/${locale}/subscriptions/${subscription.id}`)
                  }
                >
                  <Eye className="me-2 h-4 w-4" />
                  {texts.view}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {subscription.status === "ACTIVE" && (
                  <DropdownMenuItem
                    onClick={() =>
                      freezeSubscription.mutate({ id: subscription.id })
                    }
                  >
                    <Snowflake className="me-2 h-4 w-4" />
                    {texts.freeze}
                  </DropdownMenuItem>
                )}
                {subscription.status === "FROZEN" && (
                  <DropdownMenuItem
                    onClick={() =>
                      unfreezeSubscription.mutate(subscription.id)
                    }
                  >
                    <Sun className="me-2 h-4 w-4" />
                    {texts.unfreeze}
                  </DropdownMenuItem>
                )}
                {(subscription.status === "ACTIVE" ||
                  subscription.status === "FROZEN") && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      if (
                        confirm(
                          locale === "ar"
                            ? "هل أنت متأكد من إلغاء هذا الاشتراك؟"
                            : "Are you sure you want to cancel this subscription?"
                        )
                      ) {
                        cancelSubscription.mutate(subscription.id);
                      }
                    }}
                  >
                    <XCircle className="me-2 h-4 w-4" />
                    {texts.cancel}
                  </DropdownMenuItem>
                )}
                {(subscription.status === "EXPIRED" ||
                  subscription.status === "CANCELLED") && (
                  <DropdownMenuItem
                    onClick={() => renewSubscription.mutate(subscription.id)}
                  >
                    <RefreshCw className="me-2 h-4 w-4" />
                    {texts.renew}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [
      locale,
      texts,
      router,
      freezeSubscription,
      unfreezeSubscription,
      cancelSubscription,
      renewSubscription,
    ]
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
        <Button asChild>
          <Link href={`/${locale}/subscriptions/new`}>
            <Plus className="me-2 h-4 w-4" />
            {texts.addSubscription}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as SubscriptionStatus | "ALL");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={texts.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{texts.all}</SelectItem>
                <SelectItem value="ACTIVE">{texts.active}</SelectItem>
                <SelectItem value="FROZEN">{texts.frozen}</SelectItem>
                <SelectItem value="CANCELLED">{texts.cancelled}</SelectItem>
                <SelectItem value="EXPIRED">{texts.expired}</SelectItem>
                <SelectItem value="PENDING">{texts.pending}</SelectItem>
              </SelectContent>
            </Select>
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
    </div>
  );
}
