"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Plus, Target, RefreshCw, Activity, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { getScoringRuleColumns } from "@/components/admin/scoring-rule-columns";
import {
  useScoringRules,
  useScoringStats,
  useDeleteScoringRule,
  useActivateScoringRule,
  useDeactivateScoringRule,
} from "@/queries/use-lead-rules";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ScoringRule } from "@/types/lead-rules";
import { toast } from "sonner";

export default function ScoringRulesPage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const [deleteRule, setDeleteRule] = useState<ScoringRule | null>(null);
  const [pendingRuleId, setPendingRuleId] = useState<string | null>(null);

  const { data: rules, isLoading, refetch } = useScoringRules();
  const { data: stats } = useScoringStats();
  const deleteMutation = useDeleteScoringRule();
  const activateMutation = useActivateScoringRule();
  const deactivateMutation = useDeactivateScoringRule();

  const handleEdit = (rule: ScoringRule) => {
    router.push(`/${locale}/settings/scoring-rules/${rule.id}`);
  };

  const handleDelete = async () => {
    if (!deleteRule) return;
    setPendingRuleId(deleteRule.id);
    try {
      await deleteMutation.mutateAsync(deleteRule.id);
      toast.success(isArabic ? "تم حذف القاعدة" : "Rule deleted");
    } catch {
      toast.error(isArabic ? "فشل في الحذف" : "Failed to delete");
    } finally {
      setDeleteRule(null);
      setPendingRuleId(null);
    }
  };

  const handleActivate = async (rule: ScoringRule) => {
    setPendingRuleId(rule.id);
    try {
      await activateMutation.mutateAsync(rule.id);
      toast.success(isArabic ? "تم تفعيل القاعدة" : "Rule activated");
    } catch {
      toast.error(isArabic ? "فشل في التفعيل" : "Failed to activate");
    } finally {
      setPendingRuleId(null);
    }
  };

  const handleDeactivate = async (rule: ScoringRule) => {
    setPendingRuleId(rule.id);
    try {
      await deactivateMutation.mutateAsync(rule.id);
      toast.success(isArabic ? "تم إلغاء تفعيل القاعدة" : "Rule deactivated");
    } catch {
      toast.error(isArabic ? "فشل في إلغاء التفعيل" : "Failed to deactivate");
    } finally {
      setPendingRuleId(null);
    }
  };

  const columns = getScoringRuleColumns({
    locale,
    onEdit: handleEdit,
    onDelete: setDeleteRule,
    onActivate: handleActivate,
    onDeactivate: handleDeactivate,
    pendingRuleId,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isArabic ? "قواعد النقاط" : "Scoring Rules"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إدارة قواعد احتساب نقاط العملاء المحتملين"
              : "Manage lead scoring rules for automatic scoring"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href={`/${locale}/settings/scoring-rules/new`}>
            <Button>
              <Plus className="h-4 w-4 me-2" />
              {isArabic ? "إضافة قاعدة" : "Add Rule"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalRules}</div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? "إجمالي القواعد" : "Total Rules"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-500/10 p-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.activeRules}</div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? "قواعد مفعلة" : "Active Rules"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-500/10 p-3">
                  <Activity className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {Object.keys(stats.rulesByTriggerType || {}).length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic ? "أنواع المحفزات" : "Trigger Types"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {isArabic ? "قواعد النقاط" : "Scoring Rules"}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? "احتساب النقاط تلقائياً بناءً على مصادر العملاء والأنشطة"
              : "Automatically calculate scores based on lead sources and activities"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={rules ?? []}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteRule} onOpenChange={() => setDeleteRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArabic ? "حذف القاعدة؟" : "Delete Rule?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? `هل أنت متأكد من حذف "${deleteRule?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${deleteRule?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isArabic ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {isArabic ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
