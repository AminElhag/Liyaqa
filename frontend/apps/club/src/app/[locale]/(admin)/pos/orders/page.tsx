"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ShoppingBag,
  MoreHorizontal,
  Eye,
  FileText,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
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
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { MemberSelector } from "@/components/shop";
import { useOrders } from "@liyaqa/shared/queries/use-shop";
import { getLocalizedText, formatCurrency } from "@liyaqa/shared/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@liyaqa/shared/types/shop";
import type { Member } from "@liyaqa/shared/types/member";

export default function AdminOrdersPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const initialMemberId = searchParams.get("memberId");

  const [page, setPage] = useState(0);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Use memberId from URL or selected member
  const activeMemberId = selectedMember?.id || initialMemberId || undefined;

  const { data: ordersData, isLoading } = useOrders(activeMemberId, {
    page,
    size: 20,
  });

  const texts = {
    title: locale === "ar" ? "الطلبات" : "Orders",
    subtitle:
      locale === "ar"
        ? "عرض سجل طلبات العضو"
        : "View member order history",
    selectMember:
      locale === "ar"
        ? "اختر عضواً لعرض طلباته"
        : "Select a member to view their orders",
    allOrders:
      locale === "ar"
        ? "عرض جميع الطلبات"
        : "Showing all orders (no member filter)",
    noOrders: locale === "ar" ? "لا توجد طلبات" : "No orders found",
    orderId: locale === "ar" ? "رقم الطلب" : "Order ID",
    member: locale === "ar" ? "العضو" : "Member",
    status: locale === "ar" ? "الحالة" : "Status",
    items: locale === "ar" ? "العناصر" : "Items",
    total: locale === "ar" ? "الإجمالي" : "Total",
    date: locale === "ar" ? "التاريخ" : "Date",
    view: locale === "ar" ? "عرض" : "View",
    viewInvoice: locale === "ar" ? "عرض الفاتورة" : "View Invoice",
    previous: locale === "ar" ? "السابق" : "Previous",
    next: locale === "ar" ? "التالي" : "Next",
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === "ar" ? "ar-SA" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{texts.title}</h1>
        <p className="text-muted-foreground">{texts.subtitle}</p>
      </div>

      {/* Member Filter */}
      <MemberSelector
        selectedMember={selectedMember}
        onSelect={setSelectedMember}
        onClear={() => setSelectedMember(null)}
      />

      {!activeMemberId && (
        <p className="text-sm text-muted-foreground">{texts.allOrders}</p>
      )}

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !ordersData?.content?.length ? (
            <div className="py-12 text-center text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
              <p>{texts.noOrders}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{texts.orderId}</TableHead>
                  <TableHead>{texts.member}</TableHead>
                  <TableHead>{texts.status}</TableHead>
                  <TableHead>{texts.items}</TableHead>
                  <TableHead>{texts.total}</TableHead>
                  <TableHead>{texts.date}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersData.content.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/${locale}/pos/orders/${order.id}`}
                        className="font-mono text-sm hover:underline"
                      >
                        {order.id.slice(0, 8)}...
                      </Link>
                    </TableCell>
                    <TableCell>
                      {order.memberName ? (
                        <LocalizedText text={order.memberName} />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                      {order.memberEmail && (
                        <p className="text-xs text-muted-foreground">
                          {order.memberEmail}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={ORDER_STATUS_COLORS[order.status]}
                        variant="secondary"
                      >
                        {ORDER_STATUS_LABELS[order.status][locale as "en" | "ar"]}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.itemCount}</TableCell>
                    <TableCell>
                      {formatCurrency(
                        order.grandTotal.amount,
                        order.grandTotal.currency
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/pos/orders/${order.id}`}>
                              <Eye className="h-4 w-4 me-2" />
                              {texts.view}
                            </Link>
                          </DropdownMenuItem>
                          {order.invoiceId && (
                            <DropdownMenuItem asChild>
                              <Link href={`/${locale}/invoices/${order.invoiceId}`}>
                                <FileText className="h-4 w-4 me-2" />
                                {texts.viewInvoice}
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {ordersData && ordersData.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            {texts.previous}
          </Button>
          <span className="py-2 px-4 text-sm">
            {page + 1} / {ordersData.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= ordersData.totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            {texts.next}
          </Button>
        </div>
      )}
    </div>
  );
}
