"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
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
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useCreateContract } from "@liyaqa/shared/queries/platform/use-compliance";
import type { ContractType } from "@liyaqa/shared/types/platform/compliance";

export default function NewContractPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();
  const { toast } = useToast();

  const createContract = useCreateContract();

  const [tenantId, setTenantId] = useState("");
  const [type, setType] = useState<ContractType>("SERVICE_AGREEMENT");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("SAR");

  const texts = {
    back: isRtl ? "العودة إلى العقود" : "Back to Contracts",
    title: isRtl ? "إنشاء عقد جديد" : "Create New Contract",
    description: isRtl ? "إنشاء عقد امتثال جديد" : "Create a new compliance contract",
    tenantId: isRtl ? "معرّف المستأجر" : "Tenant ID",
    tenantIdPlaceholder: isRtl ? "أدخل معرّف المستأجر" : "Enter tenant ID",
    type: isRtl ? "النوع" : "Type",
    startDate: isRtl ? "تاريخ البدء" : "Start Date",
    endDate: isRtl ? "تاريخ الانتهاء" : "End Date",
    autoRenew: isRtl ? "تجديد تلقائي" : "Auto Renew",
    autoRenewDescription: isRtl ? "تجديد العقد تلقائياً عند انتهائه" : "Automatically renew the contract upon expiry",
    value: isRtl ? "القيمة" : "Value",
    currency: isRtl ? "العملة" : "Currency",
    create: isRtl ? "إنشاء العقد" : "Create Contract",
    cancel: isRtl ? "إلغاء" : "Cancel",
    createSuccess: isRtl ? "تم إنشاء العقد بنجاح" : "Contract created successfully",
    errorTitle: isRtl ? "خطأ" : "Error",
    serviceAgreement: isRtl ? "اتفاقية خدمة" : "Service Agreement",
    sla: isRtl ? "اتفاقية مستوى الخدمة" : "SLA",
    dataProcessing: isRtl ? "معالجة بيانات" : "Data Processing",
    custom: isRtl ? "مخصص" : "Custom",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createContract.mutate(
      {
        tenantId,
        type,
        startDate,
        endDate,
        autoRenew,
        value: value ? parseFloat(value) : undefined,
        currency: currency || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: texts.createSuccess });
          router.push(`/${locale}/compliance/contracts`);
        },
        onError: (err) => {
          toast({ title: texts.errorTitle, description: err.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/compliance/contracts`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
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
              {/* Tenant ID */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="tenantId">{texts.tenantId}</Label>
                <Input
                  id="tenantId"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder={texts.tenantIdPlaceholder}
                  required
                />
              </div>

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
              <Button type="submit" disabled={createContract.isPending}>
                <Plus className="me-2 h-4 w-4" />
                {texts.create}
              </Button>
              <Button variant="outline" type="button" asChild>
                <Link href={`/${locale}/compliance/contracts`}>
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
