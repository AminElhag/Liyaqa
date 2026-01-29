"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Minus, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAdjustPoints, useEarnPoints, useRedeemPoints } from "@/queries/use-loyalty";
import type { UUID } from "@/types/api";
import type { PointsSource } from "@/types/loyalty";

const ADJUSTMENT_REASONS = [
  { value: "CORRECTION", labelEn: "Correction", labelAr: "تصحيح" },
  { value: "GOODWILL", labelEn: "Goodwill Gesture", labelAr: "بادرة حسن نية" },
  { value: "PROMOTION", labelEn: "Promotional Bonus", labelAr: "مكافأة ترويجية" },
  { value: "COMPENSATION", labelEn: "Compensation", labelAr: "تعويض" },
  { value: "MANUAL_EARN", labelEn: "Manual Earning", labelAr: "كسب يدوي" },
  { value: "MANUAL_REDEEM", labelEn: "Manual Redemption", labelAr: "استبدال يدوي" },
  { value: "OTHER", labelEn: "Other", labelAr: "أخرى" },
];

const formSchema = z.object({
  points: z.coerce.number().positive("Points must be greater than 0"),
  reason: z.string().min(1, "Please select a reason"),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PointsAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: UUID;
  memberName?: string;
  currentBalance?: number;
}

export function PointsAdjustmentDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  currentBalance = 0,
}: PointsAdjustmentDialogProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [mode, setMode] = React.useState<"add" | "deduct">("add");

  const earnMutation = useEarnPoints();
  const redeemMutation = useRedeemPoints();
  const adjustMutation = useAdjustPoints();

  const isLoading = earnMutation.isPending || redeemMutation.isPending || adjustMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      points: 0,
      reason: "",
      descriptionEn: "",
      descriptionAr: "",
    },
  });

  const watchedPoints = form.watch("points") || 0;
  const newBalance = mode === "add"
    ? currentBalance + watchedPoints
    : Math.max(0, currentBalance - watchedPoints);

  const texts = {
    title: isRtl ? "تعديل النقاط" : "Adjust Points",
    description: isRtl
      ? `تعديل نقاط الولاء لـ ${memberName || "العضو"}`
      : `Adjust loyalty points for ${memberName || "member"}`,
    addPoints: isRtl ? "إضافة" : "Add",
    deductPoints: isRtl ? "خصم" : "Deduct",
    points: isRtl ? "النقاط" : "Points",
    reason: isRtl ? "السبب" : "Reason",
    selectReason: isRtl ? "اختر السبب" : "Select reason",
    noteEn: isRtl ? "ملاحظة (إنجليزي)" : "Note (English)",
    noteAr: isRtl ? "ملاحظة (عربي)" : "Note (Arabic)",
    currentBalance: isRtl ? "الرصيد الحالي" : "Current Balance",
    newBalance: isRtl ? "الرصيد الجديد" : "New Balance",
    cancel: isRtl ? "إلغاء" : "Cancel",
    confirm: isRtl ? "تأكيد" : "Confirm",
    processing: isRtl ? "جاري المعالجة..." : "Processing...",
    successAdd: isRtl ? "تم إضافة النقاط بنجاح" : "Points added successfully",
    successDeduct: isRtl ? "تم خصم النقاط بنجاح" : "Points deducted successfully",
    error: isRtl ? "فشل في تعديل النقاط" : "Failed to adjust points",
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const reason = ADJUSTMENT_REASONS.find((r) => r.value === data.reason);
      const descriptionEn = data.descriptionEn || reason?.labelEn || data.reason;
      const descriptionAr = data.descriptionAr || reason?.labelAr || data.reason;

      if (mode === "add") {
        await earnMutation.mutateAsync({
          memberId,
          data: {
            points: data.points,
            source: "MANUAL" as PointsSource,
            descriptionEn,
            descriptionAr,
          },
        });
        toast.success(texts.successAdd);
      } else {
        // For deductions, we use adjust with negative points or redeem
        await adjustMutation.mutateAsync({
          memberId,
          data: {
            points: -data.points,
            descriptionEn,
            descriptionAr,
          },
        });
        toast.success(texts.successDeduct);
      }

      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error(texts.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
            <Award className="h-5 w-5" />
            {texts.title}
          </DialogTitle>
          <DialogDescription className={cn(isRtl && "text-right")}>
            {texts.description}
          </DialogDescription>
        </DialogHeader>

        {/* Mode Toggle */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as "add" | "deduct")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {texts.addPoints}
            </TabsTrigger>
            <TabsTrigger value="deduct" className="flex items-center gap-2">
              <Minus className="h-4 w-4" />
              {texts.deductPoints}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Balance Preview */}
        <div className={cn("flex items-center justify-between p-3 bg-muted rounded-md3-md", isRtl && "flex-row-reverse")}>
          <div className={cn(isRtl && "text-right")}>
            <p className="text-xs text-muted-foreground">{texts.currentBalance}</p>
            <p className="text-lg font-semibold">{currentBalance.toLocaleString()}</p>
          </div>
          <div className="text-2xl text-muted-foreground">&rarr;</div>
          <div className={cn(isRtl && "text-right")}>
            <p className="text-xs text-muted-foreground">{texts.newBalance}</p>
            <p className={cn(
              "text-lg font-semibold",
              mode === "add" ? "text-green-600" : "text-amber-600"
            )}>
              {newBalance.toLocaleString()}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Points Amount */}
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(isRtl && "text-right block")}>{texts.points}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="0"
                      {...field}
                      className={cn(isRtl && "text-right")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(isRtl && "text-right block")}>{texts.reason}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={texts.selectReason} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ADJUSTMENT_REASONS.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {isRtl ? reason.labelAr : reason.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="descriptionEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{texts.noteEn}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional note..."
                        rows={2}
                        {...field}
                        className="text-sm"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descriptionAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-right block">{texts.noteAr}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="ملاحظة اختيارية..."
                        rows={2}
                        dir="rtl"
                        {...field}
                        className="text-sm text-right"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className={cn(isRtl && "flex-row-reverse")}>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {texts.cancel}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                variant={mode === "add" ? "default" : "secondary"}
              >
                {isLoading ? texts.processing : texts.confirm}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
