"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { DataTable } from "@/components/ui/data-table";
import { getPolicyColumns } from "@/components/admin/policy-columns";
import {
  usePolicies,
  useCreatePolicy,
  useSubmitForReview,
  useApprovePolicy,
  usePublishPolicy,
  useArchivePolicy,
  useReturnToDraft,
} from "@/queries/use-policies";
import type { SecurityPolicy, PolicyType, PolicyParams } from "@/types/policy";

export default function PoliciesListPage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<PolicyParams>({});
  const [formData, setFormData] = useState({
    policyType: "INFORMATION_SECURITY" as PolicyType,
    title: "",
    titleAr: "",
    content: "",
    contentAr: "",
    acknowledgementRequired: true,
  });

  const { data: policies, isLoading } = usePolicies(filters);

  const createPolicy = useCreatePolicy();
  const submitForReview = useSubmitForReview();
  const approvePolicy = useApprovePolicy();
  const publishPolicy = usePublishPolicy();
  const archivePolicy = useArchivePolicy();
  const returnToDraft = useReturnToDraft();

  const handleCreate = () => {
    createPolicy.mutate(
      {
        policyType: formData.policyType,
        title: formData.title,
        titleAr: formData.titleAr || undefined,
        content: formData.content || undefined,
        contentAr: formData.contentAr || undefined,
        acknowledgementRequired: formData.acknowledgementRequired,
      },
      {
        onSuccess: (policy) => {
          setCreateDialogOpen(false);
          setFormData({
            policyType: "INFORMATION_SECURITY",
            title: "",
            titleAr: "",
            content: "",
            contentAr: "",
            acknowledgementRequired: true,
          });
          router.push(`/settings/compliance/policies/${policy.id}`);
        },
      }
    );
  };

  const handleView = (policy: SecurityPolicy) => {
    router.push(`/settings/compliance/policies/${policy.id}`);
  };

  const handleEdit = (policy: SecurityPolicy) => {
    router.push(`/settings/compliance/policies/${policy.id}`);
  };

  const columns = getPolicyColumns({
    locale,
    onView: handleView,
    onEdit: handleEdit,
    onSubmitForReview: (p) => submitForReview.mutate(p.id),
    onApprove: (p) => approvePolicy.mutate(p.id),
    onPublish: (p) => publishPolicy.mutate({ id: p.id }),
    onArchive: (p) => archivePolicy.mutate(p.id),
    onReturnToDraft: (p) => returnToDraft.mutate(p.id),
  });

  // Stats
  const totalPolicies = policies?.length ?? 0;
  const publishedCount = policies?.filter((p) => p.status === "PUBLISHED").length ?? 0;
  const draftCount = policies?.filter((p) => p.status === "DRAFT").length ?? 0;
  const reviewDueCount = policies?.filter((p) => p.isReviewDue).length ?? 0;

  const policyTypeOptions: { value: PolicyType; label: { en: string; ar: string } }[] = [
    { value: "INFORMATION_SECURITY", label: { en: "Information Security", ar: "أمن المعلومات" } },
    { value: "DATA_PROTECTION", label: { en: "Data Protection", ar: "حماية البيانات" } },
    { value: "ACCESS_CONTROL", label: { en: "Access Control", ar: "التحكم في الوصول" } },
    { value: "INCIDENT_RESPONSE", label: { en: "Incident Response", ar: "الاستجابة للحوادث" } },
    { value: "BUSINESS_CONTINUITY", label: { en: "Business Continuity", ar: "استمرارية الأعمال" } },
    { value: "ACCEPTABLE_USE", label: { en: "Acceptable Use", ar: "الاستخدام المقبول" } },
    { value: "DATA_RETENTION", label: { en: "Data Retention", ar: "الاحتفاظ بالبيانات" } },
    { value: "PRIVACY", label: { en: "Privacy", ar: "الخصوصية" } },
    { value: "VENDOR_MANAGEMENT", label: { en: "Vendor Management", ar: "إدارة الموردين" } },
    { value: "CHANGE_MANAGEMENT", label: { en: "Change Management", ar: "إدارة التغيير" } },
    { value: "RISK_MANAGEMENT", label: { en: "Risk Management", ar: "إدارة المخاطر" } },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isArabic ? "السياسات" : "Policies"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "إدارة سياسات أمن المعلومات وحماية البيانات"
              : "Manage information security and data protection policies"}
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? "سياسة جديدة" : "New Policy"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isArabic ? "إنشاء سياسة جديدة" : "Create New Policy"}</DialogTitle>
              <DialogDescription>
                {isArabic
                  ? "إنشاء سياسة أمنية جديدة"
                  : "Create a new security policy"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label>{isArabic ? "نوع السياسة" : "Policy Type"}</Label>
                <Select
                  value={formData.policyType}
                  onValueChange={(v) => setFormData({ ...formData, policyType: v as PolicyType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {policyTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {isArabic ? opt.label.ar : opt.label.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isArabic ? "العنوان (إنجليزي)" : "Title (English)"}</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Policy title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                  <Input
                    value={formData.titleAr}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    placeholder="عنوان السياسة"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "المحتوى (إنجليزي)" : "Content (English)"}</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Policy content..."
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "المحتوى (عربي)" : "Content (Arabic)"}</Label>
                <Textarea
                  value={formData.contentAr}
                  onChange={(e) => setFormData({ ...formData, contentAr: e.target.value })}
                  placeholder="محتوى السياسة..."
                  rows={6}
                  dir="rtl"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ack"
                  checked={formData.acknowledgementRequired}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, acknowledgementRequired: checked as boolean })
                  }
                />
                <Label htmlFor="ack">
                  {isArabic ? "يتطلب إقرار الموظفين" : "Requires employee acknowledgement"}
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.title || createPolicy.isPending}
              >
                {isArabic ? "إنشاء" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "إجمالي السياسات" : "Total Policies"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPolicies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "منشورة" : "Published"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "مسودات" : "Drafts"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-600">{draftCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "تحتاج مراجعة" : "Review Due"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{reviewDueCount}</p>
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
              value={filters.policyType || "all"}
              onValueChange={(v) =>
                setFilters({ ...filters, policyType: v === "all" ? undefined : (v as PolicyType) })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isArabic ? "النوع" : "Type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? "جميع الأنواع" : "All Types"}</SelectItem>
                {policyTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {isArabic ? opt.label.ar : opt.label.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status || "all"}
              onValueChange={(v) =>
                setFilters({ ...filters, status: v === "all" ? undefined : (v as PolicyStatus) })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isArabic ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? "جميع الحالات" : "All Statuses"}</SelectItem>
                <SelectItem value="DRAFT">{isArabic ? "مسودة" : "Draft"}</SelectItem>
                <SelectItem value="UNDER_REVIEW">{isArabic ? "قيد المراجعة" : "Under Review"}</SelectItem>
                <SelectItem value="APPROVED">{isArabic ? "معتمد" : "Approved"}</SelectItem>
                <SelectItem value="PUBLISHED">{isArabic ? "منشور" : "Published"}</SelectItem>
                <SelectItem value="ARCHIVED">{isArabic ? "مؤرشف" : "Archived"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Policies Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "قائمة السياسات" : "Policy List"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "جميع سياسات أمن المعلومات"
              : "All information security policies"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <DataTable
              columns={columns}
              data={policies ?? []}
              searchKey="title"
              searchPlaceholder={isArabic ? "البحث عن السياسات..." : "Search policies..."}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
