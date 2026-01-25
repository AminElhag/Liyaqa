"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Minus, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useEarnPoints,
  useRedeemPoints,
  useAdjustPoints,
} from "@/queries/use-loyalty";
import type { UUID } from "@/types/api";
import type { PointsSource } from "@/types/loyalty";

interface EarnRedeemPointsDialogProps {
  memberId: UUID;
  currentBalance: number;
  children?: React.ReactNode;
}

const earnSchema = z.object({
  points: z.coerce.number().positive("Points must be positive"),
  source: z.enum([
    "ATTENDANCE",
    "REFERRAL",
    "PURCHASE",
    "MANUAL",
    "PROMOTION",
    "BIRTHDAY",
    "SIGNUP_BONUS",
  ]),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
});

const redeemSchema = z.object({
  points: z.coerce.number().positive("Points must be positive"),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
});

const adjustSchema = z.object({
  points: z.coerce.number().refine((val) => val !== 0, "Points cannot be zero"),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
});

type EarnFormData = z.infer<typeof earnSchema>;
type RedeemFormData = z.infer<typeof redeemSchema>;
type AdjustFormData = z.infer<typeof adjustSchema>;

const sourceOptions: { value: PointsSource; labelEn: string; labelAr: string }[] = [
  { value: "MANUAL", labelEn: "Manual", labelAr: "يدوي" },
  { value: "PROMOTION", labelEn: "Promotion", labelAr: "ترويج" },
  { value: "BIRTHDAY", labelEn: "Birthday Bonus", labelAr: "مكافأة عيد الميلاد" },
  { value: "SIGNUP_BONUS", labelEn: "Signup Bonus", labelAr: "مكافأة التسجيل" },
  { value: "ATTENDANCE", labelEn: "Check-in", labelAr: "تسجيل حضور" },
  { value: "REFERRAL", labelEn: "Referral", labelAr: "إحالة" },
  { value: "PURCHASE", labelEn: "Purchase", labelAr: "شراء" },
];

export function EarnRedeemPointsDialog({
  memberId,
  currentBalance,
  children,
}: EarnRedeemPointsDialogProps) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"earn" | "redeem" | "adjust">("earn");

  const earnMutation = useEarnPoints();
  const redeemMutation = useRedeemPoints();
  const adjustMutation = useAdjustPoints();

  const earnForm = useForm<EarnFormData>({
    resolver: zodResolver(earnSchema),
    defaultValues: {
      points: 0,
      source: "MANUAL",
      descriptionEn: "",
      descriptionAr: "",
    },
  });

  const redeemForm = useForm<RedeemFormData>({
    resolver: zodResolver(redeemSchema),
    defaultValues: {
      points: 0,
      descriptionEn: "",
      descriptionAr: "",
    },
  });

  const adjustForm = useForm<AdjustFormData>({
    resolver: zodResolver(adjustSchema),
    defaultValues: {
      points: 0,
      descriptionEn: "",
      descriptionAr: "",
    },
  });

  const handleEarn = (data: EarnFormData) => {
    earnMutation.mutate(
      { memberId, data },
      {
        onSuccess: () => {
          toast.success(
            locale === "ar"
              ? "تم إضافة النقاط بنجاح"
              : "Points earned successfully"
          );
          setOpen(false);
          earnForm.reset();
        },
        onError: () => {
          toast.error(
            locale === "ar" ? "فشل في إضافة النقاط" : "Failed to earn points"
          );
        },
      }
    );
  };

  const handleRedeem = (data: RedeemFormData) => {
    if (data.points > currentBalance) {
      toast.error(
        locale === "ar" ? "رصيد النقاط غير كافٍ" : "Insufficient points balance"
      );
      return;
    }

    redeemMutation.mutate(
      { memberId, data },
      {
        onSuccess: () => {
          toast.success(
            locale === "ar"
              ? "تم استبدال النقاط بنجاح"
              : "Points redeemed successfully"
          );
          setOpen(false);
          redeemForm.reset();
        },
        onError: () => {
          toast.error(
            locale === "ar"
              ? "فشل في استبدال النقاط"
              : "Failed to redeem points"
          );
        },
      }
    );
  };

  const handleAdjust = (data: AdjustFormData) => {
    adjustMutation.mutate(
      { memberId, data },
      {
        onSuccess: () => {
          toast.success(
            locale === "ar"
              ? "تم تعديل النقاط بنجاح"
              : "Points adjusted successfully"
          );
          setOpen(false);
          adjustForm.reset();
        },
        onError: () => {
          toast.error(
            locale === "ar" ? "فشل في تعديل النقاط" : "Failed to adjust points"
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {locale === "ar" ? "إدارة النقاط" : "Manage Points"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {locale === "ar" ? "إدارة النقاط" : "Manage Points"}
          </DialogTitle>
          <DialogDescription>
            {locale === "ar"
              ? `الرصيد الحالي: ${currentBalance.toLocaleString()} نقطة`
              : `Current balance: ${currentBalance.toLocaleString()} points`}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="earn" className="gap-1">
              <Plus className="h-4 w-4" />
              {locale === "ar" ? "إضافة" : "Earn"}
            </TabsTrigger>
            <TabsTrigger value="redeem" className="gap-1">
              <Minus className="h-4 w-4" />
              {locale === "ar" ? "استبدال" : "Redeem"}
            </TabsTrigger>
            <TabsTrigger value="adjust" className="gap-1">
              <ArrowUpDown className="h-4 w-4" />
              {locale === "ar" ? "تعديل" : "Adjust"}
            </TabsTrigger>
          </TabsList>

          {/* Earn Tab */}
          <TabsContent value="earn">
            <form onSubmit={earnForm.handleSubmit(handleEarn)} className="space-y-4">
              <div className="space-y-2">
                <Label>{locale === "ar" ? "عدد النقاط" : "Points"}</Label>
                <Input
                  type="number"
                  min={1}
                  {...earnForm.register("points")}
                />
                {earnForm.formState.errors.points && (
                  <p className="text-sm text-destructive">
                    {earnForm.formState.errors.points.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{locale === "ar" ? "المصدر" : "Source"}</Label>
                <Select
                  value={earnForm.watch("source")}
                  onValueChange={(v) => earnForm.setValue("source", v as PointsSource)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {locale === "ar" ? opt.labelAr : opt.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{locale === "ar" ? "الوصف (اختياري)" : "Description (Optional)"}</Label>
                <Textarea
                  placeholder={locale === "ar" ? "الوصف بالإنجليزية" : "Description in English"}
                  {...earnForm.register("descriptionEn")}
                />
                <Textarea
                  placeholder={locale === "ar" ? "الوصف بالعربية" : "Description in Arabic"}
                  {...earnForm.register("descriptionAr")}
                />
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={earnMutation.isPending}
                  className="w-full"
                >
                  {earnMutation.isPending
                    ? locale === "ar"
                      ? "جارٍ الإضافة..."
                      : "Adding..."
                    : locale === "ar"
                    ? "إضافة النقاط"
                    : "Add Points"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Redeem Tab */}
          <TabsContent value="redeem">
            <form onSubmit={redeemForm.handleSubmit(handleRedeem)} className="space-y-4">
              <div className="space-y-2">
                <Label>{locale === "ar" ? "عدد النقاط" : "Points"}</Label>
                <Input
                  type="number"
                  min={1}
                  max={currentBalance}
                  {...redeemForm.register("points")}
                />
                {redeemForm.formState.errors.points && (
                  <p className="text-sm text-destructive">
                    {redeemForm.formState.errors.points.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{locale === "ar" ? "الوصف (اختياري)" : "Description (Optional)"}</Label>
                <Textarea
                  placeholder={locale === "ar" ? "الوصف بالإنجليزية" : "Description in English"}
                  {...redeemForm.register("descriptionEn")}
                />
                <Textarea
                  placeholder={locale === "ar" ? "الوصف بالعربية" : "Description in Arabic"}
                  {...redeemForm.register("descriptionAr")}
                />
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={redeemMutation.isPending || currentBalance === 0}
                  variant="destructive"
                  className="w-full"
                >
                  {redeemMutation.isPending
                    ? locale === "ar"
                      ? "جارٍ الاستبدال..."
                      : "Redeeming..."
                    : locale === "ar"
                    ? "استبدال النقاط"
                    : "Redeem Points"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Adjust Tab */}
          <TabsContent value="adjust">
            <form onSubmit={adjustForm.handleSubmit(handleAdjust)} className="space-y-4">
              <div className="space-y-2">
                <Label>
                  {locale === "ar"
                    ? "عدد النقاط (موجب أو سالب)"
                    : "Points (positive or negative)"}
                </Label>
                <Input type="number" {...adjustForm.register("points")} />
                {adjustForm.formState.errors.points && (
                  <p className="text-sm text-destructive">
                    {adjustForm.formState.errors.points.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{locale === "ar" ? "الوصف (اختياري)" : "Description (Optional)"}</Label>
                <Textarea
                  placeholder={locale === "ar" ? "الوصف بالإنجليزية" : "Description in English"}
                  {...adjustForm.register("descriptionEn")}
                />
                <Textarea
                  placeholder={locale === "ar" ? "الوصف بالعربية" : "Description in Arabic"}
                  {...adjustForm.register("descriptionAr")}
                />
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={adjustMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {adjustMutation.isPending
                    ? locale === "ar"
                      ? "جارٍ التعديل..."
                      : "Adjusting..."
                    : locale === "ar"
                    ? "تعديل النقاط"
                    : "Adjust Points"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
