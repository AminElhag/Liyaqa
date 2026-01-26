"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConsents, useRecordConsent, useWithdrawConsent } from "@/queries/use-data-protection";
import type { ConsentType, ConsentMethod, ConsentParams } from "@/types/data-protection";
import { formatDate } from "@/lib/utils";

export default function ConsentsManagementPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [filters, setFilters] = useState<ConsentParams>({});
  const [formData, setFormData] = useState({
    memberId: "",
    consentType: "MARKETING" as ConsentType,
    purpose: "",
    purposeAr: "",
    consentGiven: true,
    consentMethod: "EXPLICIT_ELECTRONIC" as ConsentMethod,
    expiresAt: "",
  });

  const { data: consents, isLoading } = useConsents(filters);
  const recordConsent = useRecordConsent();
  const withdrawConsent = useWithdrawConsent();

  const handleRecord = () => {
    recordConsent.mutate(
      {
        memberId: formData.memberId || undefined,
        consentType: formData.consentType,
        purpose: formData.purpose,
        purposeAr: formData.purposeAr || undefined,
        consentGiven: formData.consentGiven,
        consentMethod: formData.consentMethod,
        expiresAt: formData.expiresAt || undefined,
      },
      {
        onSuccess: () => {
          setRecordDialogOpen(false);
          setFormData({
            memberId: "",
            consentType: "MARKETING",
            purpose: "",
            purposeAr: "",
            consentGiven: true,
            consentMethod: "EXPLICIT_ELECTRONIC",
            expiresAt: "",
          });
        },
      }
    );
  };

  const consentTypeLabels: Record<ConsentType, { en: string; ar: string }> = {
    MARKETING: { en: "Marketing", ar: "التسويق" },
    PROFILING: { en: "Profiling", ar: "التنميط" },
    THIRD_PARTY_SHARING: { en: "Third Party Sharing", ar: "مشاركة الطرف الثالث" },
    CROSS_BORDER_TRANSFER: { en: "Cross-border Transfer", ar: "النقل عبر الحدود" },
    SENSITIVE_DATA: { en: "Sensitive Data", ar: "البيانات الحساسة" },
    TERMS_OF_SERVICE: { en: "Terms of Service", ar: "شروط الخدمة" },
    PRIVACY_POLICY: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
    BIOMETRIC_DATA: { en: "Biometric Data", ar: "البيانات البيومترية" },
    HEALTH_DATA: { en: "Health Data", ar: "البيانات الصحية" },
  };

  const consentMethodLabels: Record<ConsentMethod, { en: string; ar: string }> = {
    EXPLICIT_WRITTEN: { en: "Written", ar: "مكتوب" },
    EXPLICIT_ELECTRONIC: { en: "Electronic", ar: "إلكتروني" },
    EXPLICIT_VERBAL: { en: "Verbal", ar: "شفهي" },
    IMPLICIT: { en: "Implicit", ar: "ضمني" },
    OPT_IN: { en: "Opt-in", ar: "اشتراك" },
    OPT_OUT: { en: "Opt-out", ar: "إلغاء اشتراك" },
  };

  // Stats
  const totalConsents = consents?.length ?? 0;
  const activeConsents = consents?.filter((c) => c.isValid).length ?? 0;
  const withdrawnConsents = consents?.filter((c) => c.withdrawnAt).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isArabic ? "إدارة الموافقات" : "Consents Management"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "تتبع وإدارة موافقات أصحاب البيانات"
              : "Track and manage data subject consents"}
          </p>
        </div>
        <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? "تسجيل موافقة" : "Record Consent"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isArabic ? "تسجيل موافقة جديدة" : "Record New Consent"}</DialogTitle>
              <DialogDescription>
                {isArabic
                  ? "تسجيل موافقة صاحب البيانات"
                  : "Record a data subject's consent"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{isArabic ? "معرف العضو" : "Member ID"}</Label>
                <Input
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  placeholder={isArabic ? "اختياري" : "Optional"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "نوع الموافقة" : "Consent Type"}</Label>
                <Select
                  value={formData.consentType}
                  onValueChange={(v) => setFormData({ ...formData, consentType: v as ConsentType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(consentTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {isArabic ? label.ar : label.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "الغرض" : "Purpose"}</Label>
                <Textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder={isArabic ? "وصف الغرض من الموافقة" : "Describe the purpose of consent"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "طريقة الموافقة" : "Consent Method"}</Label>
                <Select
                  value={formData.consentMethod}
                  onValueChange={(v) => setFormData({ ...formData, consentMethod: v as ConsentMethod })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(consentMethodLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {isArabic ? label.ar : label.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "تاريخ الانتهاء" : "Expiration Date"}</Label>
                <Input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="given"
                  checked={formData.consentGiven}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, consentGiven: checked as boolean })
                  }
                />
                <Label htmlFor="given">
                  {isArabic ? "الموافقة ممنوحة" : "Consent given"}
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRecordDialogOpen(false)}>
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleRecord}
                disabled={!formData.purpose || recordConsent.isPending}
              >
                {isArabic ? "تسجيل" : "Record"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "إجمالي الموافقات" : "Total Consents"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalConsents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "موافقات نشطة" : "Active Consents"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{activeConsents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "موافقات مسحوبة" : "Withdrawn Consents"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{withdrawnConsents}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "الفلاتر" : "Filters"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select
              value={filters.consentType || "all"}
              onValueChange={(v) =>
                setFilters({ ...filters, consentType: v === "all" ? undefined : (v as ConsentType) })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isArabic ? "النوع" : "Type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? "جميع الأنواع" : "All Types"}</SelectItem>
                {Object.entries(consentTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {isArabic ? label.ar : label.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Consents Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "سجل الموافقات" : "Consents Register"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "جميع موافقات أصحاب البيانات المسجلة"
              : "All recorded data subject consents"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isArabic ? "النوع" : "Type"}</TableHead>
                  <TableHead>{isArabic ? "الغرض" : "Purpose"}</TableHead>
                  <TableHead>{isArabic ? "الطريقة" : "Method"}</TableHead>
                  <TableHead>{isArabic ? "تاريخ المنح" : "Granted At"}</TableHead>
                  <TableHead>{isArabic ? "تاريخ الانتهاء" : "Expires At"}</TableHead>
                  <TableHead>{isArabic ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isArabic ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consents?.map((consent) => (
                  <TableRow key={consent.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {isArabic
                          ? consentTypeLabels[consent.consentType].ar
                          : consentTypeLabels[consent.consentType].en}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {isArabic && consent.purposeAr
                        ? consent.purposeAr
                        : consent.purpose}
                    </TableCell>
                    <TableCell>
                      {isArabic
                        ? consentMethodLabels[consent.consentMethod].ar
                        : consentMethodLabels[consent.consentMethod].en}
                    </TableCell>
                    <TableCell>
                      {consent.givenAt ? formatDate(consent.givenAt, locale) : "-"}
                    </TableCell>
                    <TableCell>
                      {consent.expiresAt ? formatDate(consent.expiresAt, locale) : "-"}
                    </TableCell>
                    <TableCell>
                      {consent.withdrawnAt ? (
                        <Badge className="bg-red-100 text-red-800">
                          {isArabic ? "مسحوب" : "Withdrawn"}
                        </Badge>
                      ) : consent.isValid ? (
                        <Badge className="bg-green-100 text-green-800">
                          {isArabic ? "نشط" : "Active"}
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {isArabic ? "منتهي" : "Expired"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {consent.isValid && !consent.withdrawnAt && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            withdrawConsent.mutate({
                              id: consent.id,
                              request: {},
                            })
                          }
                        >
                          {isArabic ? "سحب" : "Withdraw"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
