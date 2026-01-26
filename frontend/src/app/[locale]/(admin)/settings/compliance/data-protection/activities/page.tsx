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
import {
  useDataProcessingActivities,
  useCreateActivity,
  useActivateActivity,
  useArchiveActivity,
} from "@/queries/use-data-protection";
import type { LegalBasis } from "@/types/data-protection";

export default function ProcessingActivitiesPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    activityName: "",
    activityNameAr: "",
    description: "",
    purpose: "",
    purposeAr: "",
    legalBasis: "CONSENT" as LegalBasis,
    dataCategories: [] as string[],
    dataSubjects: [] as string[],
    retentionPeriodDays: "",
    crossBorderTransfer: false,
    automatedDecisionMaking: false,
    profiling: false,
  });

  const { data: activities, isLoading } = useDataProcessingActivities({});
  const createActivity = useCreateActivity();
  const activateActivity = useActivateActivity();
  const archiveActivity = useArchiveActivity();

  const handleCreate = () => {
    createActivity.mutate(
      {
        activityName: formData.activityName,
        activityNameAr: formData.activityNameAr || undefined,
        description: formData.description || undefined,
        purpose: formData.purpose,
        purposeAr: formData.purposeAr || undefined,
        legalBasis: formData.legalBasis,
        dataCategories: formData.dataCategories,
        dataSubjects: formData.dataSubjects,
        retentionPeriodDays: formData.retentionPeriodDays ? parseInt(formData.retentionPeriodDays) : undefined,
        crossBorderTransfer: formData.crossBorderTransfer,
        automatedDecisionMaking: formData.automatedDecisionMaking,
        profiling: formData.profiling,
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          setFormData({
            activityName: "",
            activityNameAr: "",
            description: "",
            purpose: "",
            purposeAr: "",
            legalBasis: "CONSENT",
            dataCategories: [],
            dataSubjects: [],
            retentionPeriodDays: "",
            crossBorderTransfer: false,
            automatedDecisionMaking: false,
            profiling: false,
          });
        },
      }
    );
  };

  const legalBasisLabels: Record<LegalBasis, { en: string; ar: string }> = {
    CONSENT: { en: "Consent", ar: "الموافقة" },
    CONTRACT: { en: "Contract", ar: "العقد" },
    LEGAL_OBLIGATION: { en: "Legal Obligation", ar: "الالتزام القانوني" },
    VITAL_INTERESTS: { en: "Vital Interests", ar: "المصالح الحيوية" },
    PUBLIC_INTEREST: { en: "Public Interest", ar: "المصلحة العامة" },
    LEGITIMATE_INTERESTS: { en: "Legitimate Interests", ar: "المصالح المشروعة" },
  };

  const statusColors: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-700",
    ACTIVE: "bg-green-100 text-green-800",
    ARCHIVED: "bg-gray-100 text-gray-600",
  };

  const statusLabels: Record<string, { en: string; ar: string }> = {
    DRAFT: { en: "Draft", ar: "مسودة" },
    ACTIVE: { en: "Active", ar: "نشط" },
    ARCHIVED: { en: "Archived", ar: "مؤرشف" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isArabic ? "أنشطة المعالجة" : "Processing Activities"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "سجل أنشطة معالجة البيانات الشخصية وفقاً للمادة 7 من PDPL"
              : "Record of personal data processing activities per PDPL Article 7"}
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? "نشاط جديد" : "New Activity"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isArabic ? "تسجيل نشاط معالجة جديد" : "Register New Processing Activity"}</DialogTitle>
              <DialogDescription>
                {isArabic
                  ? "أضف نشاط معالجة بيانات جديد إلى السجل"
                  : "Add a new data processing activity to the register"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isArabic ? "اسم النشاط (إنجليزي)" : "Activity Name (English)"}</Label>
                  <Input
                    value={formData.activityName}
                    onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                    placeholder="e.g., Member Registration"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? "اسم النشاط (عربي)" : "Activity Name (Arabic)"}</Label>
                  <Input
                    value={formData.activityNameAr}
                    onChange={(e) => setFormData({ ...formData, activityNameAr: e.target.value })}
                    placeholder="مثل: تسجيل الأعضاء"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "الغرض" : "Purpose"}</Label>
                <Textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder={isArabic ? "الغرض من معالجة البيانات" : "Purpose of data processing"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "الأساس القانوني" : "Legal Basis"}</Label>
                <Select
                  value={formData.legalBasis}
                  onValueChange={(v) => setFormData({ ...formData, legalBasis: v as LegalBasis })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(legalBasisLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {isArabic ? label.ar : label.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "فئات البيانات" : "Data Categories"}</Label>
                <Input
                  value={formData.dataCategories.join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dataCategories: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder={isArabic ? "مثل: الاسم، البريد الإلكتروني" : "e.g., Name, Email, Phone"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "أصحاب البيانات" : "Data Subjects"}</Label>
                <Input
                  value={formData.dataSubjects.join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dataSubjects: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder={isArabic ? "مثل: الأعضاء، الموظفين" : "e.g., Members, Employees"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "فترة الاحتفاظ (أيام)" : "Retention Period (days)"}</Label>
                <Input
                  type="number"
                  value={formData.retentionPeriodDays}
                  onChange={(e) => setFormData({ ...formData, retentionPeriodDays: e.target.value })}
                  placeholder="365"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="crossBorder"
                    checked={formData.crossBorderTransfer}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, crossBorderTransfer: checked as boolean })
                    }
                  />
                  <Label htmlFor="crossBorder">
                    {isArabic ? "نقل عبر الحدود" : "Cross-border transfer"}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="automated"
                    checked={formData.automatedDecisionMaking}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, automatedDecisionMaking: checked as boolean })
                    }
                  />
                  <Label htmlFor="automated">
                    {isArabic ? "اتخاذ قرار آلي" : "Automated decision-making"}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="profiling"
                    checked={formData.profiling}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, profiling: checked as boolean })
                    }
                  />
                  <Label htmlFor="profiling">
                    {isArabic ? "التنميط" : "Profiling"}
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.activityName || !formData.purpose || createActivity.isPending}
              >
                {isArabic ? "تسجيل" : "Register"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "سجل الأنشطة" : "Activities Register"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "جميع أنشطة معالجة البيانات المسجلة"
              : "All registered data processing activities"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isArabic ? "النشاط" : "Activity"}</TableHead>
                  <TableHead>{isArabic ? "الغرض" : "Purpose"}</TableHead>
                  <TableHead>{isArabic ? "الأساس القانوني" : "Legal Basis"}</TableHead>
                  <TableHead>{isArabic ? "فئات البيانات" : "Data Categories"}</TableHead>
                  <TableHead>{isArabic ? "الاحتفاظ" : "Retention"}</TableHead>
                  <TableHead>{isArabic ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isArabic ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities?.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">
                      {isArabic && activity.activityNameAr
                        ? activity.activityNameAr
                        : activity.activityName}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {isArabic && activity.purposeAr
                        ? activity.purposeAr
                        : activity.purpose}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {isArabic
                          ? legalBasisLabels[activity.legalBasis].ar
                          : legalBasisLabels[activity.legalBasis].en}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {activity.dataCategories.slice(0, 2).map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                        {activity.dataCategories.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{activity.dataCategories.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {activity.retentionPeriodDays
                        ? `${activity.retentionPeriodDays} ${isArabic ? "يوم" : "days"}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[activity.status]}>
                        {isArabic
                          ? statusLabels[activity.status].ar
                          : statusLabels[activity.status].en}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {activity.status === "DRAFT" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => activateActivity.mutate(activity.id)}
                          >
                            {isArabic ? "تفعيل" : "Activate"}
                          </Button>
                        )}
                        {activity.status === "ACTIVE" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => archiveActivity.mutate(activity.id)}
                          >
                            {isArabic ? "أرشفة" : "Archive"}
                          </Button>
                        )}
                      </div>
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
