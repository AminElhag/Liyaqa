"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Plus,
  Package,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  useProducts,
  useProductStats,
  useActivateProduct,
  useDeactivateProduct,
  useDeleteProduct,
} from "@liyaqa/shared/queries/use-products";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { getLocalizedText, formatCurrency } from "@liyaqa/shared/utils";
import {
  PRODUCT_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
  type ProductStatus,
  type ProductType,
} from "@liyaqa/shared/types/product";

export default function ProductsPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ProductType | "all">("all");

  const { data: productsData, isLoading } = useProducts({
    page,
    size: 20,
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
  });
  const { data: stats } = useProductStats();

  const activateProduct = useActivateProduct();
  const deactivateProduct = useDeactivateProduct();
  const deleteProduct = useDeleteProduct();

  const texts = {
    title: locale === "ar" ? "المنتجات" : "Products",
    addNew: locale === "ar" ? "إضافة منتج" : "Add Product",
    search: locale === "ar" ? "بحث..." : "Search...",
    total: locale === "ar" ? "الإجمالي" : "Total",
    active: locale === "ar" ? "نشط" : "Active",
    inactive: locale === "ar" ? "غير نشط" : "Inactive",
    draft: locale === "ar" ? "مسودة" : "Draft",
    goods: locale === "ar" ? "سلع" : "Goods",
    services: locale === "ar" ? "خدمات" : "Services",
    bundles: locale === "ar" ? "حزم" : "Bundles",
    name: locale === "ar" ? "الاسم" : "Name",
    type: locale === "ar" ? "النوع" : "Type",
    price: locale === "ar" ? "السعر" : "Price",
    status: locale === "ar" ? "الحالة" : "Status",
    stock: locale === "ar" ? "المخزون" : "Stock",
    allStatus: locale === "ar" ? "جميع الحالات" : "All Statuses",
    allTypes: locale === "ar" ? "جميع الأنواع" : "All Types",
    view: locale === "ar" ? "عرض" : "View",
    edit: locale === "ar" ? "تعديل" : "Edit",
    activate: locale === "ar" ? "تفعيل" : "Activate",
    deactivate: locale === "ar" ? "إلغاء التفعيل" : "Deactivate",
    delete: locale === "ar" ? "حذف" : "Delete",
    noProducts: locale === "ar" ? "لا توجد منتجات" : "No products found",
    unlimited: locale === "ar" ? "غير محدود" : "Unlimited",
  };

  const handleActivate = async (id: string) => {
    try {
      await activateProduct.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم التفعيل" : "Activated",
        description: locale === "ar" ? "تم تفعيل المنتج بنجاح" : "Product activated successfully",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في تفعيل المنتج" : "Failed to activate product",
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateProduct.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم إلغاء التفعيل" : "Deactivated",
        description: locale === "ar" ? "تم إلغاء تفعيل المنتج بنجاح" : "Product deactivated successfully",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في إلغاء تفعيل المنتج" : "Failed to deactivate product",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === "ar" ? "هل أنت متأكد من حذف هذا المنتج؟" : "Are you sure you want to delete this product?")) {
      return;
    }
    try {
      await deleteProduct.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم الحذف" : "Deleted",
        description: locale === "ar" ? "تم حذف المنتج بنجاح" : "Product deleted successfully",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في حذف المنتج" : "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const getStatusVariant = (status: ProductStatus) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "INACTIVE":
        return "secondary";
      case "DRAFT":
        return "outline";
      case "DISCONTINUED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{texts.title}</h1>
        </div>
        <Button asChild>
          <Link href={`/${locale}/products/new`}>
            <Plus className="h-4 w-4 me-2" />
            {texts.addNew}
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.total}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.active}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.inactive}</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.inactive ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.draft}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.draft ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.goods}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.goods ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.services}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.services ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.bundles}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.bundles ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            setStatusFilter(value as ProductStatus | "all");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={texts.allStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{texts.allStatus}</SelectItem>
            <SelectItem value="DRAFT">{PRODUCT_STATUS_LABELS.DRAFT[locale as "en" | "ar"]}</SelectItem>
            <SelectItem value="ACTIVE">{PRODUCT_STATUS_LABELS.ACTIVE[locale as "en" | "ar"]}</SelectItem>
            <SelectItem value="INACTIVE">{PRODUCT_STATUS_LABELS.INACTIVE[locale as "en" | "ar"]}</SelectItem>
            <SelectItem value="DISCONTINUED">{PRODUCT_STATUS_LABELS.DISCONTINUED[locale as "en" | "ar"]}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value as ProductType | "all");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={texts.allTypes} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{texts.allTypes}</SelectItem>
            <SelectItem value="GOODS">{PRODUCT_TYPE_LABELS.GOODS[locale as "en" | "ar"]}</SelectItem>
            <SelectItem value="SERVICE">{PRODUCT_TYPE_LABELS.SERVICE[locale as "en" | "ar"]}</SelectItem>
            <SelectItem value="BUNDLE">{PRODUCT_TYPE_LABELS.BUNDLE[locale as "en" | "ar"]}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !productsData?.content?.length ? (
            <div className="py-12 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
              <p>{texts.noProducts}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{texts.name}</TableHead>
                  <TableHead>{texts.type}</TableHead>
                  <TableHead>{texts.price}</TableHead>
                  <TableHead>{texts.stock}</TableHead>
                  <TableHead>{texts.status}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsData.content.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Link
                        href={`/${locale}/products/${product.id}`}
                        className="font-medium hover:underline"
                      >
                        {getLocalizedText(product.name, locale)}
                      </Link>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PRODUCT_TYPE_LABELS[product.productType][locale as "en" | "ar"]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(product.listPrice.amount, product.listPrice.currency)}
                    </TableCell>
                    <TableCell>
                      {product.trackInventory
                        ? product.stockQuantity ?? 0
                        : texts.unlimited}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(product.status)}>
                        {PRODUCT_STATUS_LABELS[product.status][locale as "en" | "ar"]}
                      </Badge>
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
                            <Link href={`/${locale}/products/${product.id}`}>
                              {texts.view}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/products/${product.id}/edit`}>
                              {texts.edit}
                            </Link>
                          </DropdownMenuItem>
                          {product.status === "ACTIVE" ? (
                            <DropdownMenuItem onClick={() => handleDeactivate(product.id)}>
                              <XCircle className="h-4 w-4 me-2" />
                              {texts.deactivate}
                            </DropdownMenuItem>
                          ) : product.status !== "DISCONTINUED" ? (
                            <DropdownMenuItem onClick={() => handleActivate(product.id)}>
                              <CheckCircle className="h-4 w-4 me-2" />
                              {texts.activate}
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            onClick={() => handleDelete(product.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 me-2" />
                            {texts.delete}
                          </DropdownMenuItem>
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
      {productsData && productsData.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            {locale === "ar" ? "السابق" : "Previous"}
          </Button>
          <span className="py-2 px-4 text-sm">
            {page + 1} / {productsData.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= productsData.totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            {locale === "ar" ? "التالي" : "Next"}
          </Button>
        </div>
      )}
    </div>
  );
}
