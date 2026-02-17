"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Checkbox } from "@liyaqa/shared/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useContractById,
  useUpdateContract,
} from "@liyaqa/shared/queries/platform/use-compliance";
import type { ContractType } from "@liyaqa/shared/types/platform/compliance";

export default function EditContractPage() {
  const params = useParams();
  const contractId = params.id as string;
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();
  const { toast } = useToast();

  const { data: contract, isLoading, error } = useContractById(contractId);
  const updateContract = useUpdateContract();

  const [type, setType] = useState<ContractType>("SERVICE_AGREEMENT");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("SAR");

  useEffect(() => {
    if (contract) {
      setType(contract.type);
      setStartDate(contract.startDate);
      setEndDate(contract.endDate);
      setAutoRenew(contract.autoRenew);
      setValue(contract.value?.toString() || "");
      setCurrency(contract.currency || "SAR");
    }
  }, [contract]);

  const texts = {
    back: isRtl ? "العودة" : "Back",
    title: isRtl ? "تعديل العقد" : "Edit Contract",
    description: isRtl ? "تعديل تفاصيل العقد" : "Edit contract details",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
    notFound: isRtl ? "العقد غير موجود" : "Contract not found",
    errorLoading: isRtl ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    type: isRtl ? "النوع" : "Type",
    startDate: isRtl ? "تاريخ البدء" : "Start Date",
    endDate: isRtl ? "تاريخ الانتهاء" : "End Date",
    autoRenew: isRtl ? "تجديد تلقائي" : "Auto Renew",
    autoRenewDescription: isRtl ? "تجديد العقد تلقائياً عند انتهائه" : "Automatically renew the contract upon expiry",
    value: isRtl ? "القيمة" : "Value",
    currency: isRtl ? "العملة" : "Currency",
    save: isRtl ? "حفظ التغييرات" : "Save Changes",
    cancel: isRtl ? "إلغاء" : "Cancel",
    saveSuccess: isRtl ? "تم تحديث العقد بنجاح" : "Contract updated successfully",
    errorTitle: isRtl ? "خطأ" : "Error",
    serviceAgreement: isRtl ? "اتفاقية خدمة" : "Service Agreement",
    sla: isRtl ? "اتفاقية مستوى الخدمة" : "SLA",
    dataProcessing: isRtl ? "معالجة بيانات" : "Data Processing",
    custom: isRtl ? "مخصص" : "Custom",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateContract.mutate(
      {
        id: contractId,
        data: {
          type,
          startDate,
          endDate,
          autoRenew,
          value: value ? parseFloat(value) : undefined,
          currency: currency || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: texts.saveSuccess });
          router.push(`/${locale}/compliance/contracts/${contractId}`);
        },
        onError: (err) => {
          toast({ title: texts.errorTitle, description: err.message, variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.errorLoading : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/compliance/contracts/${contractId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">
            {texts.description} - <span className="font-mono">{contract.contractNumber}</span>
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">{texts.type}</Label>
                <Select value={type} onValueChange={(val) => setType(val as ContractType)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SERVICE_AGREEMENT">{texts.serviceAgreement}</SelectItem>
                    <SelectItem value="SLA">{texts.sla}</SelectItem>
                    <SelectItem value="DATA_PROCESSING">{texts.dataProcessing}</SelectItem>
                    <SelectItem value="CUSTOM">{texts.custom}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency">{texts.currency}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate">{texts.startDate}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="endDate">{texts.endDate}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              {/* Value */}
              <div className="space-y-2">
                <Label htmlFor="value">{texts.value}</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Auto Renew */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Checkbox
                id="autoRenew"
                checked={autoRenew}
                onCheckedChange={(checked) => setAutoRenew(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="autoRenew" className="cursor-pointer">
                  {texts.autoRenew}
                </Label>
                <p className="text-sm text-muted-foreground">{texts.autoRenewDescription}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button type="submit" disabled={updateContract.isPending}>
                <Save className="me-2 h-4 w-4" />
                {texts.save}
              </Button>
              <Button variant="outline" type="button" asChild>
                <Link href={`/${locale}/compliance/contracts/${contractId}`}>
                  {texts.cancel}
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
