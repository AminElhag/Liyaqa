"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useLocale } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Button } from "./button";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  isLoading?: boolean;
  enableSelection?: boolean;
  onSelectionChange?: (selectedRows: TData[]) => void;
  onRowClick?: (row: TData) => void;
  manualPagination?: boolean;
  totalRows?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  pageCount: controlledPageCount,
  pageIndex: controlledPageIndex,
  pageSize: controlledPageSize = 10,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  enableSelection = false,
  onSelectionChange,
  manualPagination = false,
  totalRows,
}: DataTableProps<TData, TValue>) {
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Add selection column if enabled
  const columnsWithSelection = React.useMemo(() => {
    if (!enableSelection) return columns;

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={locale === "ar" ? "تحديد الكل" : "Select all"}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={locale === "ar" ? "تحديد الصف" : "Select row"}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };

    return [selectionColumn, ...columns];
  }, [columns, enableSelection, locale]);

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    ...(manualPagination ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination,
    pageCount: controlledPageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      ...(manualPagination && {
        pagination: {
          pageIndex: controlledPageIndex || 0,
          pageSize: controlledPageSize,
        },
      }),
    },
  });

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table
        .getSelectedRowModel()
        .rows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange, table]);

  const texts = {
    search: locale === "ar" ? "بحث..." : "Search...",
    noResults: locale === "ar" ? "لا توجد نتائج" : "No results.",
    rowsSelected:
      locale === "ar"
        ? `تم تحديد ${table.getFilteredSelectedRowModel().rows.length} من ${
            table.getFilteredRowModel().rows.length
          } صف(صفوف)`
        : `${table.getFilteredSelectedRowModel().rows.length} of ${
            table.getFilteredRowModel().rows.length
          } row(s) selected.`,
    rowsPerPage: locale === "ar" ? "صفوف لكل صفحة" : "Rows per page",
    page: locale === "ar" ? "صفحة" : "Page",
    of: locale === "ar" ? "من" : "of",
    goToFirst: locale === "ar" ? "الأولى" : "Go to first page",
    goToPrevious: locale === "ar" ? "السابقة" : "Go to previous page",
    goToNext: locale === "ar" ? "التالية" : "Go to next page",
    goToLast: locale === "ar" ? "الأخيرة" : "Go to last page",
  };

  const actualPageCount = manualPagination
    ? controlledPageCount || 1
    : table.getPageCount();
  const actualPageIndex = manualPagination
    ? controlledPageIndex || 0
    : table.getState().pagination.pageIndex;
  const actualPageSize = manualPagination
    ? controlledPageSize
    : table.getState().pagination.pageSize;

  return (
    <div className="space-y-4">
      {/* Search */}
      {searchKey && (
        <div className="flex items-center">
          <Input
            placeholder={searchPlaceholder || texts.search}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "flex items-center gap-2 cursor-pointer select-none"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="text-muted-foreground">
                            {header.column.getIsSorted() === "desc" ? (
                              <ArrowDown className="h-4 w-4" />
                            ) : header.column.getIsSorted() === "asc" ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columnsWithSelection.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnsWithSelection.length}
                  className="h-24 text-center"
                >
                  {texts.noResults}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {enableSelection && texts.rowsSelected}
          {totalRows !== undefined && (
            <span className="ms-2">
              {locale === "ar"
                ? `(${totalRows} إجمالي)`
                : `(${totalRows} total)`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{texts.rowsPerPage}</p>
            <Select
              value={String(actualPageSize)}
              onValueChange={(value) => {
                const newSize = Number(value);
                if (manualPagination && onPageSizeChange) {
                  onPageSizeChange(newSize);
                } else {
                  table.setPageSize(newSize);
                }
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={actualPageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page indicator */}
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            {texts.page} {actualPageIndex + 1} {texts.of} {actualPageCount}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => {
                if (manualPagination && onPageChange) {
                  onPageChange(0);
                } else {
                  table.setPageIndex(0);
                }
              }}
              disabled={actualPageIndex === 0}
            >
              <span className="sr-only">{texts.goToFirst}</span>
              {isRTL ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <ChevronsLeft className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (manualPagination && onPageChange) {
                  onPageChange(actualPageIndex - 1);
                } else {
                  table.previousPage();
                }
              }}
              disabled={actualPageIndex === 0}
            >
              <span className="sr-only">{texts.goToPrevious}</span>
              {isRTL ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (manualPagination && onPageChange) {
                  onPageChange(actualPageIndex + 1);
                } else {
                  table.nextPage();
                }
              }}
              disabled={actualPageIndex >= actualPageCount - 1}
            >
              <span className="sr-only">{texts.goToNext}</span>
              {isRTL ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => {
                if (manualPagination && onPageChange) {
                  onPageChange(actualPageCount - 1);
                } else {
                  table.setPageIndex(actualPageCount - 1);
                }
              }}
              disabled={actualPageIndex >= actualPageCount - 1}
            >
              <span className="sr-only">{texts.goToLast}</span>
              {isRTL ? (
                <ChevronsLeft className="h-4 w-4" />
              ) : (
                <ChevronsRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to create sortable column header
 */
export function SortableHeader({
  column,
  title,
}: {
  column: { getIsSorted: () => "asc" | "desc" | false };
  title: string;
}) {
  const sorted = column.getIsSorted();
  return (
    <div className="flex items-center gap-2">
      {title}
      {sorted === "desc" ? (
        <ArrowDown className="h-4 w-4" />
      ) : sorted === "asc" ? (
        <ArrowUp className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}
