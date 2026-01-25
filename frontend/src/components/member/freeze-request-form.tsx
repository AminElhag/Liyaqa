"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Loader2, Snowflake, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFreezeSubscriptionWithTracking } from "@/queries/use-freeze-packages";
import type { FreezeBalance, FreezeType } from "@/types/freeze";

interface FreezeRequestFormProps {
  subscriptionId: string;
  balance?: FreezeBalance | null;
  maxDays?: number;
  onSuccess?: () => void;
}

const FREEZE_TYPE_LABELS: Record<FreezeType, { en: string; ar: string }> = {
  MEDICAL: { en: "Medical", ar: "طبي" },
  TRAVEL: { en: "Travel", ar: "سفر" },
  PERSONAL: { en: "Personal", ar: "شخصي" },
  MILITARY: { en: "Military Service", ar: "خدمة عسكرية" },
  OTHER: { en: "Other", ar: "أخرى" },
};

export function FreezeRequestForm({
  subscriptionId,
  balance,
  maxDays = 30,
  onSuccess,
}: FreezeRequestFormProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [freezeType, setFreezeType] = useState<FreezeType | "">("");
  const [freezeDays, setFreezeDays] = useState<number>(7);
  const [reason, setReason] = useState("");

  const freezeMutation = useFreezeSubscriptionWithTracking();

  const availableDays = balance?.availableDays ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!freezeType || !freezeDays || freezeDays <= 0) {
      toast.error(
        isArabic
          ? "يرجى ملء جميع الحقول المطلوبة"
          : "Please fill in all required fields"
      );
      return;
    }

    if (freezeDays > availableDays) {
      toast.error(
        isArabic
          ? "عدد الأيام أكبر من الرصيد المتاح"
          : "Days requested exceed available balance"
      );
      return;
    }

    try {
      await freezeMutation.mutateAsync({
        subscriptionId,
        data: {
          freezeDays,
          freezeType: freezeType as FreezeType,
          reason: reason || undefined,
        },
      });

      toast.success(
        isArabic
          ? "تم تجميد الاشتراك بنجاح"
          : "Subscription frozen successfully"
      );

      setFreezeType("");
      setFreezeDays(7);
      setReason("");
      onSuccess?.();
    } catch {
      toast.error(
        isArabic
          ? "فشل في تجميد الاشتراك"
          : "Failed to freeze subscription"
      );
    }
  };

  if (availableDays <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-blue-500" />
            {isArabic ? "طلب تجميد" : "Request Freeze"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {isArabic ? "لا يوجد رصيد تجميد" : "No Freeze Balance"}
            </AlertTitle>
            <AlertDescription>
              {isArabic
                ? "ليس لديك أيام تجميد متاحة. يرجى التواصل مع إدارة النادي."
                : "You don't have any freeze days available. Please contact the club administration."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Snowflake className="h-5 w-5 text-blue-500" />
          {isArabic ? "طلب تجميد جديد" : "New Freeze Request"}
        </CardTitle>
        <CardDescription>
          {isArabic
            ? `لديك ${availableDays} يوم تجميد متاح`
            : `You have ${availableDays} freeze days available`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Freeze Type */}
          <div className="space-y-2">
            <Label>{isArabic ? "سبب التجميد" : "Freeze Reason"} *</Label>
            <Select
              value={freezeType}
              onValueChange={(value) => setFreezeType(value as FreezeType)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={isArabic ? "اختر السبب" : "Select a reason"}
                />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FREEZE_TYPE_LABELS) as FreezeType[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {isArabic
                      ? FREEZE_TYPE_LABELS[key].ar
                      : FREEZE_TYPE_LABELS[key].en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Freeze Days */}
          <div className="space-y-2">
            <Label>
              {isArabic ? "عدد الأيام" : "Number of Days"} *
              <span className="text-muted-foreground text-xs ms-1">
                ({isArabic ? `حد أقصى ${Math.min(availableDays, maxDays)}` : `max ${Math.min(availableDays, maxDays)}`})
              </span>
            </Label>
            <Input
              type="number"
              min={1}
              max={Math.min(availableDays, maxDays)}
              value={freezeDays}
              onChange={(e) => setFreezeDays(parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Additional Reason */}
          <div className="space-y-2">
            <Label>{isArabic ? "تفاصيل إضافية" : "Additional Details"}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isArabic
                  ? "أضف أي تفاصيل إضافية (اختياري)"
                  : "Add any additional details (optional)"
              }
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={freezeMutation.isPending || !freezeType || freezeDays <= 0}
            className="w-full"
          >
            {freezeMutation.isPending && (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            )}
            {isArabic ? "تقديم طلب التجميد" : "Submit Freeze Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
