"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Plus, Users, Percent, UserCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFamilyGroups } from "@/queries/use-family-groups";
import type { FamilyGroupSummary, AccountStatus, FamilyBillingType } from "@/types/accounts";

const statusConfig: Record<AccountStatus, { labelEn: string; labelAr: string; variant: "default" | "secondary" | "destructive" }> = {
  ACTIVE: { labelEn: "Active", labelAr: "نشط", variant: "default" },
  SUSPENDED: { labelEn: "Suspended", labelAr: "معلق", variant: "secondary" },
  TERMINATED: { labelEn: "Terminated", labelAr: "منتهي", variant: "destructive" },
};

const billingTypeLabels: Record<FamilyBillingType, { en: string; ar: string }> = {
  INDIVIDUAL: { en: "Individual", ar: "فردي" },
  PRIMARY_PAYS_ALL: { en: "Primary Pays", ar: "الرئيسي يدفع" },
  SPLIT: { en: "Split", ar: "مقسم" },
};

function FamilyGroupCard({ group }: { group: FamilyGroupSummary }) {
  const locale = useLocale();
  const statusInfo = statusConfig[group.status];
  const billingLabel = billingTypeLabels[group.billingType as FamilyBillingType] || { en: "Individual", ar: "فردي" };

  return (
    <Link href={`/${locale}/family-groups/${group.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{group.name}</CardTitle>
              <CardDescription>
                {locale === "ar" ? billingLabel.ar : billingLabel.en}
              </CardDescription>
            </div>
            <Badge variant={statusInfo.variant}>
              {locale === "ar" ? statusInfo.labelAr : statusInfo.labelEn}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {group.memberCount} / {group.maxMembers}{" "}
                {locale === "ar" ? "أعضاء" : "members"}
              </span>
            </div>
            {group.discountPercentage > 0 && (
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span>
                  {group.discountPercentage}%{" "}
                  {locale === "ar" ? "خصم" : "discount"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function FamilyGroupsPage() {
  const locale = useLocale();
  const [page, setPage] = useState(0);
  const { data, isLoading } = useFamilyGroups({ page, size: 12 });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  const groups: FamilyGroupSummary[] = data?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {locale === "ar" ? "مجموعات العائلة" : "Family Groups"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "إدارة اشتراكات مجموعات العائلة"
              : "Manage family group memberships"}
          </p>
        </div>
        <Link href={`/${locale}/family-groups/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {locale === "ar" ? "مجموعة جديدة" : "New Group"}
          </Button>
        </Link>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {locale === "ar" ? "لا توجد مجموعات عائلية" : "No Family Groups"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {locale === "ar"
                ? "لم يتم إنشاء أي مجموعات عائلية بعد"
                : "No family groups have been created yet"}
            </p>
            <Link href={`/${locale}/family-groups/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {locale === "ar" ? "إنشاء مجموعة" : "Create Group"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <FamilyGroupCard key={group.id} group={group} />
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={data.first}
              >
                {locale === "ar" ? "السابق" : "Previous"}
              </Button>
              <span className="flex items-center px-4">
                {page + 1} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last}
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
