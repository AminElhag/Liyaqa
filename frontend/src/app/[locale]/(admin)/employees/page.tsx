"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Users,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  PowerOff,
  Clock,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useEmployees,
  useActivateEmployee,
  useDeactivateEmployee,
  useSetEmployeeOnLeave,
  useTerminateEmployee,
} from "@/queries/use-employees";
import { useToast } from "@/hooks/use-toast";
import { formatDate, getLocalizedText } from "@/lib/utils";
import type { EmployeeStatus, EmploymentType } from "@/types/employee";

export default function EmployeesPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | "all">("all");

  const { data, isLoading, error } = useEmployees({
    page,
    size: 20,
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const activateEmployee = useActivateEmployee();
  const deactivateEmployee = useDeactivateEmployee();
  const setOnLeave = useSetEmployeeOnLeave();
  const terminateEmployee = useTerminateEmployee();

  const handleActivate = async (id: string) => {
    try {
      await activateEmployee.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم التفعيل" : "Activated",
        description: locale === "ar" ? "تم تفعيل الموظف بنجاح" : "Employee activated",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في تفعيل الموظف" : "Failed to activate employee",
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateEmployee.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم التعطيل" : "Deactivated",
        description: locale === "ar" ? "تم تعطيل الموظف بنجاح" : "Employee deactivated",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في تعطيل الموظف" : "Failed to deactivate employee",
        variant: "destructive",
      });
    }
  };

  const handleSetOnLeave = async (id: string) => {
    try {
      await setOnLeave.mutateAsync(id);
      toast({
        title: locale === "ar" ? "في إجازة" : "On Leave",
        description: locale === "ar" ? "تم تعيين الموظف في إجازة" : "Employee set on leave",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في تعيين الإجازة" : "Failed to set on leave",
        variant: "destructive",
      });
    }
  };

  const handleTerminate = async (id: string) => {
    try {
      await terminateEmployee.mutateAsync({ id });
      toast({
        title: locale === "ar" ? "تم الإنهاء" : "Terminated",
        description: locale === "ar" ? "تم إنهاء خدمة الموظف" : "Employee terminated",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: locale === "ar" ? "فشل في إنهاء الخدمة" : "Failed to terminate",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: EmployeeStatus) => {
    const statusConfig: Record<
      EmployeeStatus,
      { variant: "success" | "warning" | "destructive" | "secondary" | "default"; labelEn: string; labelAr: string }
    > = {
      ACTIVE: { variant: "success", labelEn: "Active", labelAr: "نشط" },
      INACTIVE: { variant: "secondary", labelEn: "Inactive", labelAr: "غير نشط" },
      ON_LEAVE: { variant: "warning", labelEn: "On Leave", labelAr: "في إجازة" },
      PROBATION: { variant: "default", labelEn: "Probation", labelAr: "فترة تجربة" },
      TERMINATED: { variant: "destructive", labelEn: "Terminated", labelAr: "منتهي الخدمة" },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant}>
        {locale === "ar" ? config.labelAr : config.labelEn}
      </Badge>
    );
  };

  const getEmploymentTypeBadge = (type: EmploymentType) => {
    const types: Record<EmploymentType, { labelEn: string; labelAr: string }> = {
      FULL_TIME: { labelEn: "Full Time", labelAr: "دوام كامل" },
      PART_TIME: { labelEn: "Part Time", labelAr: "دوام جزئي" },
      CONTRACT: { labelEn: "Contract", labelAr: "عقد" },
      INTERN: { labelEn: "Intern", labelAr: "متدرب" },
      SEASONAL: { labelEn: "Seasonal", labelAr: "موسمي" },
    };

    const config = types[type];
    return (
      <Badge variant="outline">
        {locale === "ar" ? config.labelAr : config.labelEn}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {locale === "ar" ? "الموظفون" : "Employees"}
          </h1>
          <p className="text-neutral-500">
            {locale === "ar" ? "إدارة موظفي النادي" : "Manage club employees"}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/employees/new`}>
            <Plus className="h-4 w-4 me-2" />
            {locale === "ar" ? "إضافة موظف" : "Add Employee"}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder={locale === "ar" ? "بحث بالاسم أو البريد..." : "Search by name or email..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as EmployeeStatus | "all")}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={locale === "ar" ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {locale === "ar" ? "جميع الحالات" : "All Statuses"}
                </SelectItem>
                <SelectItem value="ACTIVE">
                  {locale === "ar" ? "نشط" : "Active"}
                </SelectItem>
                <SelectItem value="INACTIVE">
                  {locale === "ar" ? "غير نشط" : "Inactive"}
                </SelectItem>
                <SelectItem value="ON_LEAVE">
                  {locale === "ar" ? "في إجازة" : "On Leave"}
                </SelectItem>
                <SelectItem value="PROBATION">
                  {locale === "ar" ? "فترة تجربة" : "Probation"}
                </SelectItem>
                <SelectItem value="TERMINATED">
                  {locale === "ar" ? "منتهي الخدمة" : "Terminated"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center text-neutral-500">
            {locale === "ar" ? "فشل في تحميل الموظفين" : "Failed to load employees"}
          </CardContent>
        </Card>
      )}

      {/* Employees list */}
      {!isLoading && !error && (
        <>
          {data?.content.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-neutral-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
                <p>{locale === "ar" ? "لا يوجد موظفون" : "No employees found"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data?.content.map((employee) => (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {getLocalizedText(employee.fullName, locale)}
                        </CardTitle>
                        <CardDescription>{employee.email}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/employees/${employee.id}`}>
                              <Eye className="h-4 w-4 me-2" />
                              {locale === "ar" ? "عرض" : "View"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/employees/${employee.id}/edit`}>
                              <Pencil className="h-4 w-4 me-2" />
                              {locale === "ar" ? "تعديل" : "Edit"}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {employee.status !== "ACTIVE" && employee.status !== "TERMINATED" && (
                            <DropdownMenuItem onClick={() => handleActivate(employee.id)}>
                              <Power className="h-4 w-4 me-2" />
                              {locale === "ar" ? "تفعيل" : "Activate"}
                            </DropdownMenuItem>
                          )}
                          {employee.status === "ACTIVE" && (
                            <>
                              <DropdownMenuItem onClick={() => handleDeactivate(employee.id)}>
                                <PowerOff className="h-4 w-4 me-2" />
                                {locale === "ar" ? "تعطيل" : "Deactivate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSetOnLeave(employee.id)}>
                                <Clock className="h-4 w-4 me-2" />
                                {locale === "ar" ? "إجازة" : "Set On Leave"}
                              </DropdownMenuItem>
                            </>
                          )}
                          {employee.status !== "TERMINATED" && (
                            <DropdownMenuItem
                              onClick={() => handleTerminate(employee.id)}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 me-2" />
                              {locale === "ar" ? "إنهاء الخدمة" : "Terminate"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {getStatusBadge(employee.status)}
                      {getEmploymentTypeBadge(employee.employmentType)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-neutral-500 space-y-1">
                      {employee.departmentName && (
                        <p>{getLocalizedText(employee.departmentName, locale)}</p>
                      )}
                      {employee.jobTitleName && (
                        <p>{getLocalizedText(employee.jobTitleName, locale)}</p>
                      )}
                      <p className="text-xs">
                        {locale === "ar" ? "تاريخ التعيين:" : "Hired:"}{" "}
                        {formatDate(employee.hireDate, locale)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                {locale === "ar" ? "السابق" : "Previous"}
              </Button>
              <span className="flex items-center px-4 text-sm">
                {page + 1} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
              >
                {locale === "ar" ? "التالي" : "Next"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
