"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { getFrameworkColumns } from "@/components/admin/framework-columns";
import {
  useComplianceFrameworks,
  useOrganizationComplianceStatus,
} from "@/queries/use-compliance";
import type { ComplianceFramework } from "@/types/compliance";

export default function FrameworksListPage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const { data: frameworks, isLoading: loadingFrameworks } = useComplianceFrameworks({ active: true });
  const { data: statuses, isLoading: loadingStatuses } = useOrganizationComplianceStatus();

  const isLoading = loadingFrameworks || loadingStatuses;

  const columns = getFrameworkColumns({
    locale,
    statuses: statuses ?? [],
  });

  const handleRowClick = (framework: ComplianceFramework) => {
    router.push(`/settings/compliance/frameworks/${framework.code}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isArabic ? "أطر الامتثال" : "Compliance Frameworks"}
        </h1>
        <p className="text-muted-foreground">
          {isArabic
            ? "إدارة وتتبع الامتثال لأطر الأمان والخصوصية"
            : "Manage and track compliance with security and privacy frameworks"}
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <DataTable
          columns={columns}
          data={frameworks ?? []}
          searchKey="name"
          searchPlaceholder={isArabic ? "البحث عن إطار..." : "Search frameworks..."}
          onRowClick={handleRowClick}
        />
      )}
    </div>
  );
}
