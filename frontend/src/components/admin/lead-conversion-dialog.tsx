"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Loader2, UserPlus, CreditCard, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateMember } from "@/queries/use-members";
import { useCreateSubscription } from "@/queries/use-subscriptions";
import { usePlans } from "@/queries/use-plans";
import { useConvertLead } from "@/queries/use-leads";
import type { Lead } from "@/types/lead";
import type { MembershipPlan } from "@/types/member";

interface LeadConversionDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ConversionStep = "plan" | "review" | "complete";

export function LeadConversionDialog({
  lead,
  open,
  onOpenChange,
  onSuccess,
}: LeadConversionDialogProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [step, setStep] = useState<ConversionStep>("plan");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [generateInvoice, setGenerateInvoice] = useState(true);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const { data: plansData, isLoading: plansLoading } = usePlans({ active: true });
  const createMemberMutation = useCreateMember();
  const createSubscriptionMutation = useCreateSubscription();
  const convertLeadMutation = useConvertLead();

  const selectedPlan = plansData?.content?.find((p) => p.id === selectedPlanId);

  const handleReset = () => {
    setStep("plan");
    setSelectedPlanId("");
    setGenerateInvoice(true);
    setStartDate(new Date().toISOString().split("T")[0]);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleConvert = async () => {
    if (!lead || !selectedPlanId) return;

    try {
      // Step 1: Create the member
      const nameParts = lead.name.split(" ");
      const firstName = nameParts[0] || lead.name;
      const lastName = nameParts.slice(1).join(" ") || "";

      const member = await createMemberMutation.mutateAsync({
        firstName: { en: firstName },
        lastName: { en: lastName },
        email: lead.email,
        phone: lead.phone || "",
      });

      // Step 2: Create subscription for the member
      await createSubscriptionMutation.mutateAsync({
        memberId: member.id,
        planId: selectedPlanId,
        startDate,
      });

      // Step 3: Mark lead as converted
      await convertLeadMutation.mutateAsync({
        id: lead.id,
        data: { memberId: member.id },
      });

      setStep("complete");
      toast.success(
        isArabic
          ? "تم تحويل العميل المحتمل إلى عضو بنجاح"
          : "Lead converted to member successfully"
      );

      onSuccess?.();
    } catch (error) {
      toast.error(
        isArabic
          ? "فشل في تحويل العميل المحتمل"
          : "Failed to convert lead"
      );
    }
  };

  const formatMoney = (amount: number | { amount: number } | undefined) => {
    if (!amount) return "SAR 0";
    const value = typeof amount === "object" ? amount.amount : amount;
    return new Intl.NumberFormat(isArabic ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: "SAR",
    }).format(value);
  };

  const isProcessing = createMemberMutation.isPending || createSubscriptionMutation.isPending || convertLeadMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === "complete"
              ? isArabic ? "تم التحويل بنجاح" : "Conversion Complete"
              : isArabic ? "تحويل العميل المحتمل" : "Convert Lead"}
          </DialogTitle>
          <DialogDescription>
            {step === "plan" &&
              (isArabic
                ? `تحويل ${lead?.name} إلى عضو`
                : `Convert ${lead?.name} to a member`)}
            {step === "review" &&
              (isArabic
                ? "مراجعة التفاصيل قبل التحويل"
                : "Review details before conversion")}
            {step === "complete" &&
              (isArabic
                ? "تم إنشاء العضو والاشتراك بنجاح"
                : "Member and subscription created successfully")}
          </DialogDescription>
        </DialogHeader>

        {step === "plan" && (
          <div className="space-y-4 py-4">
            {/* Plan Selection */}
            <div className="space-y-2">
              <Label>{isArabic ? "خطة الاشتراك" : "Subscription Plan"}</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      plansLoading
                        ? isArabic ? "جاري التحميل..." : "Loading..."
                        : isArabic ? "اختر الخطة" : "Select a plan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {plansData?.content?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {isArabic ? plan.name?.ar : plan.name?.en}
                        </span>
                        <span className="text-muted-foreground">
                          {formatMoney(plan.recurringTotal)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>{isArabic ? "تاريخ البدء" : "Start Date"}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Generate Invoice */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Checkbox
                id="generateInvoice"
                checked={generateInvoice}
                onCheckedChange={(checked) => setGenerateInvoice(checked === true)}
              />
              <Label htmlFor="generateInvoice" className="text-sm cursor-pointer">
                {isArabic ? "إنشاء فاتورة تلقائياً" : "Generate invoice automatically"}
              </Label>
            </div>
          </div>
        )}

        {step === "review" && lead && selectedPlan && (
          <div className="space-y-4 py-4">
            {/* Lead Info */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {isArabic ? "بيانات العميل" : "Lead Information"}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">{isArabic ? "الاسم:" : "Name:"}</span> {lead.name}</p>
                  <p><span className="text-muted-foreground">{isArabic ? "البريد:" : "Email:"}</span> {lead.email}</p>
                  {lead.phone && (
                    <p><span className="text-muted-foreground">{isArabic ? "الهاتف:" : "Phone:"}</span> {lead.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Plan Info */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {isArabic ? "الخطة المختارة" : "Selected Plan"}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {isArabic ? selectedPlan.name?.ar : selectedPlan.name?.en}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      {isArabic ? "السعر:" : "Price:"}
                    </span>{" "}
                    {formatMoney(selectedPlan.recurringTotal)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      {isArabic ? "تاريخ البدء:" : "Start Date:"}
                    </span>{" "}
                    {startDate}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Invoice */}
            {generateInvoice && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {isArabic ? "الفاتورة" : "Invoice"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isArabic
                      ? "سيتم إنشاء فاتورة تلقائياً للاشتراك"
                      : "An invoice will be automatically generated for the subscription"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === "complete" && (
          <div className="py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-muted-foreground">
              {isArabic
                ? "تم تحويل العميل المحتمل إلى عضو بنجاح"
                : "Lead has been successfully converted to a member"}
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "plan" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={() => setStep("review")}
                disabled={!selectedPlanId}
              >
                {isArabic ? "التالي" : "Next"}
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <Button variant="outline" onClick={() => setStep("plan")}>
                {isArabic ? "رجوع" : "Back"}
              </Button>
              <Button onClick={handleConvert} disabled={isProcessing}>
                {isProcessing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {isArabic ? "تحويل" : "Convert"}
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button onClick={handleClose}>
              {isArabic ? "إغلاق" : "Close"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
