"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Plus, RefreshCw, Filter, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadKanbanBoard } from "@/components/admin/lead-kanban-board";
import { usePipelineStats, useLeads } from "@/queries/use-leads";
import { useUsers } from "@/queries/use-users";
import type { LeadSource } from "@/types/lead";
import { LEAD_SOURCE_LABELS } from "@/types/lead";

export default function LeadsPipelinePage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "">("");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");

  const { data: stats } = usePipelineStats();
  const { refetch } = useLeads({ size: 1 }); // Just for refetch
  const { data: usersData } = useUsers({ page: 0, size: 100 });

  const clearFilters = () => {
    setAssigneeFilter("");
    setSourceFilter("");
    setDateFromFilter("");
    setDateToFilter("");
  };

  const hasFilters = assigneeFilter || sourceFilter || dateFromFilter || dateToFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? "خط المبيعات" : "Sales Pipeline"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "عرض كانبان لإدارة العملاء المحتملين"
              : "Kanban view for managing leads"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/leads`}>
            <Button variant="outline" size="icon" title={isArabic ? "عرض الجدول" : "Table View"}>
              <List className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href={`/${locale}/leads/new`}>
            <Button>
              <Plus className="h-4 w-4 me-2" />
              {isArabic ? "إضافة عميل محتمل" : "Add Lead"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {isArabic ? "إجمالي العملاء" : "Total Leads"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                {isArabic ? "نشط" : "Active"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                {stats.byStatus.WON || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {isArabic ? "مكتسب" : "Won"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {(stats.conversionRate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {isArabic ? "معدل التحويل" : "Conversion Rate"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {isArabic ? "التصفية" : "Filters"}
            </span>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {isArabic ? "مسح الكل" : "Clear All"}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <div className="grid md:grid-cols-4 gap-4">
            <Select
              value={assigneeFilter}
              onValueChange={(value) => setAssigneeFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={isArabic ? "المسؤول" : "Assignee"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{isArabic ? "الكل" : "All"}</SelectItem>
                {usersData?.content?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.displayName?.en || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sourceFilter}
              onValueChange={(value) => setSourceFilter(value as LeadSource | "")}
            >
              <SelectTrigger>
                <SelectValue placeholder={isArabic ? "المصدر" : "Source"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{isArabic ? "جميع المصادر" : "All Sources"}</SelectItem>
                {Object.entries(LEAD_SOURCE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {isArabic ? label.ar : label.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div>
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                placeholder={isArabic ? "من تاريخ" : "From Date"}
              />
            </div>

            <div>
              <Input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                placeholder={isArabic ? "إلى تاريخ" : "To Date"}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <LeadKanbanBoard
        filterAssignee={assigneeFilter || undefined}
        filterSource={sourceFilter || undefined}
        filterDateFrom={dateFromFilter || undefined}
        filterDateTo={dateToFilter || undefined}
      />
    </div>
  );
}
