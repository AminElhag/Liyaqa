"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Percent,
  DollarSign,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loading, Spinner } from "@/components/ui/spinner";
import {
  useAllPricingTiers,
  useCreatePricingTier,
  useUpdatePricingTier,
  useDeletePricingTier,
} from "@/queries/use-admin-contracts";
import { useActivePlans } from "@/queries/use-plans";
import { ContractTerm, ContractPricingTier, CreatePricingTierRequest } from "@/types/contract";
import { UUID } from "@/types/api";
import { toast } from "sonner";

interface TierFormData {
  planId: string;
  contractTerm: ContractTerm;
  discountPercentage: string;
  overrideMonthlyFee: string;
}

export default function PricingTiersPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  // State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<ContractPricingTier | null>(null);
  const [deletingTierId, setDeletingTierId] = useState<UUID | null>(null);

  // Queries
  const { data: tiers, isLoading: tiersLoading } = useAllPricingTiers();
  const { data: plans, isLoading: plansLoading } = useActivePlans();

  // Mutations
  const createMutation = useCreatePricingTier();
  const updateMutation = useUpdatePricingTier();
  const deleteMutation = useDeletePricingTier();

  // Form
  const form = useForm<TierFormData>({
    defaultValues: {
      planId: "",
      contractTerm: "ANNUAL",
      discountPercentage: "",
      overrideMonthlyFee: "",
    },
  });

  const openCreateDialog = () => {
    form.reset({
      planId: "",
      contractTerm: "ANNUAL",
      discountPercentage: "",
      overrideMonthlyFee: "",
    });
    setEditingTier(null);
    setDialogOpen(true);
  };

  const openEditDialog = (tier: ContractPricingTier) => {
    form.reset({
      planId: tier.planId,
      contractTerm: tier.contractTerm,
      discountPercentage: tier.discountPercentage?.toString() || "",
      overrideMonthlyFee: tier.overrideMonthlyFeeAmount?.toString() || "",
    });
    setEditingTier(tier);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: TierFormData) => {
    try {
      const request: CreatePricingTierRequest = {
        planId: data.planId as UUID,
        contractTerm: data.contractTerm,
        discountPercentage: data.discountPercentage ? parseFloat(data.discountPercentage) : undefined,
        overrideMonthlyFeeAmount: data.overrideMonthlyFee ? parseFloat(data.overrideMonthlyFee) : undefined,
      };

      if (editingTier) {
        await updateMutation.mutateAsync({ id: editingTier.id, data: request });
        toast.success(isArabic ? "تم تحديث السعر" : "Pricing tier updated");
      } else {
        await createMutation.mutateAsync(request);
        toast.success(isArabic ? "تم إنشاء السعر" : "Pricing tier created");
      }
      setDialogOpen(false);
    } catch {
      toast.error(isArabic ? "حدث خطأ" : "An error occurred");
    }
  };

  const handleDelete = async () => {
    if (!deletingTierId) return;
    try {
      await deleteMutation.mutateAsync(deletingTierId);
      toast.success(isArabic ? "تم حذف السعر" : "Pricing tier deleted");
      setDeletingTierId(null);
    } catch {
      toast.error(isArabic ? "حدث خطأ" : "An error occurred");
    }
  };

  const getTermLabel = (term: ContractTerm) => {
    const labels: Record<ContractTerm, { en: string; ar: string }> = {
      MONTHLY: { en: "Monthly", ar: "شهري" },
      QUARTERLY: { en: "Quarterly (3 months)", ar: "ربع سنوي (3 أشهر)" },
      SEMI_ANNUAL: { en: "Semi-Annual (6 months)", ar: "نصف سنوي (6 أشهر)" },
      ANNUAL: { en: "Annual (12 months)", ar: "سنوي (12 شهر)" },
    };
    return isArabic ? labels[term].ar : labels[term].en;
  };

  const texts = {
    title: isArabic ? "إعداد أسعار العقود" : "Contract Pricing Tiers",
    description: isArabic
      ? "إعداد الخصومات والأسعار المخصصة لكل مدة عقد"
      : "Configure discounts and custom pricing for each contract term",
    addTier: isArabic ? "إضافة سعر" : "Add Tier",
    plan: isArabic ? "الباقة" : "Plan",
    term: isArabic ? "مدة العقد" : "Contract Term",
    discount: isArabic ? "الخصم" : "Discount",
    overridePrice: isArabic ? "السعر المخصص" : "Override Price",
    status: isArabic ? "الحالة" : "Status",
    actions: isArabic ? "الإجراءات" : "Actions",
    active: isArabic ? "نشط" : "Active",
    inactive: isArabic ? "غير نشط" : "Inactive",
    noTiers: isArabic ? "لا توجد أسعار مخصصة" : "No pricing tiers configured",
    createTier: isArabic ? "إنشاء سعر جديد" : "Create Pricing Tier",
    editTier: isArabic ? "تعديل السعر" : "Edit Pricing Tier",
    createDesc: isArabic
      ? "قم بإنشاء سعر مخصص لمدة عقد معينة"
      : "Create a custom price for a specific contract term",
    selectPlan: isArabic ? "اختر الباقة" : "Select plan",
    selectTerm: isArabic ? "اختر المدة" : "Select term",
    discountPercent: isArabic ? "نسبة الخصم (%)" : "Discount Percentage (%)",
    overrideFee: isArabic ? "الرسوم الشهرية المخصصة" : "Override Monthly Fee",
    save: isArabic ? "حفظ" : "Save",
    cancel: isArabic ? "إلغاء" : "Cancel",
    delete: isArabic ? "حذف" : "Delete",
    deleteTitle: isArabic ? "حذف السعر؟" : "Delete Pricing Tier?",
    deleteDesc: isArabic
      ? "هل أنت متأكد من حذف هذا السعر؟ لن يتأثر العقود الحالية."
      : "Are you sure you want to delete this pricing tier? Existing contracts won't be affected.",
    or: isArabic ? "أو" : "or",
  };

  const isLoading = tiersLoading || plansLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  // Group tiers by plan
  const tiersByPlan = tiers?.reduce((acc, tier) => {
    if (!acc[tier.planId]) {
      acc[tier.planId] = [];
    }
    acc[tier.planId].push(tier);
    return acc;
  }, {} as Record<string, ContractPricingTier[]>) || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{texts.title}</CardTitle>
                <CardDescription>{texts.description}</CardDescription>
              </div>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 me-2" />
              {texts.addTier}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!tiers?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{texts.noTiers}</p>
              <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 me-2" />
                {texts.addTier}
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{texts.plan}</TableHead>
                    <TableHead>{texts.term}</TableHead>
                    <TableHead>{texts.discount}</TableHead>
                    <TableHead>{texts.overridePrice}</TableHead>
                    <TableHead>{texts.status}</TableHead>
                    <TableHead className="text-right">{texts.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell className="font-medium">{tier.planName}</TableCell>
                      <TableCell>{getTermLabel(tier.contractTerm)}</TableCell>
                      <TableCell>
                        {tier.discountPercentage ? (
                          <Badge variant="secondary" className="gap-1">
                            <Percent className="h-3 w-3" />
                            {tier.discountPercentage}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tier.overrideMonthlyFeeAmount ? (
                          <span className="font-medium">
                            {tier.overrideMonthlyFeeAmount} {tier.overrideMonthlyFeeCurrency}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tier.isActive ? "default" : "secondary"}>
                          {tier.isActive ? texts.active : texts.inactive}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(tier)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingTierId(tier.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTier ? texts.editTier : texts.createTier}
            </DialogTitle>
            <DialogDescription>{texts.createDesc}</DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{texts.plan}</Label>
              <Select
                value={form.watch("planId")}
                onValueChange={(v) => form.setValue("planId", v)}
                disabled={!!editingTier}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectPlan} />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {isArabic ? plan.name.ar || plan.name.en : plan.name.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{texts.term}</Label>
              <Select
                value={form.watch("contractTerm")}
                onValueChange={(v) => form.setValue("contractTerm", v as ContractTerm)}
                disabled={!!editingTier}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectTerm} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">{getTermLabel("MONTHLY")}</SelectItem>
                  <SelectItem value="QUARTERLY">{getTermLabel("QUARTERLY")}</SelectItem>
                  <SelectItem value="SEMI_ANNUAL">{getTermLabel("SEMI_ANNUAL")}</SelectItem>
                  <SelectItem value="ANNUAL">{getTermLabel("ANNUAL")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  {texts.discountPercent}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g., 20"
                  {...form.register("discountPercentage")}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {texts.overrideFee}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 249"
                  {...form.register("overrideMonthlyFee")}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {isArabic
                ? "يمكنك تحديد نسبة خصم أو سعر مخصص، أو كليهما."
                : "You can specify a discount percentage, an override price, or both."}
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                {texts.cancel}
              </Button>
              <Button type="submit" disabled={isSaving || !form.watch("planId")}>
                {isSaving && <Spinner className="h-4 w-4 me-2" />}
                {texts.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deletingTierId !== null}
        onOpenChange={() => setDeletingTierId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{texts.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{texts.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {texts.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Spinner className="h-4 w-4 me-2" />}
              {texts.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
