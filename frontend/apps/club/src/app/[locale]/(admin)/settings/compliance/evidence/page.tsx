"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@liyaqa/shared/components/ui/dialog";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Upload, Plus } from "lucide-react";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { getEvidenceColumns } from "@/components/admin/evidence-columns";
import {
  useComplianceEvidence,
  useComplianceRequirements,
  useUploadEvidence,
  useVerifyEvidence,
  useDeleteEvidence,
} from "@liyaqa/shared/queries/use-compliance";
import type { EvidenceType, ComplianceEvidenceParams } from "@liyaqa/shared/types/compliance";

export default function EvidenceManagementPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [filters, setFilters] = useState<ComplianceEvidenceParams>({});
  const [uploadForm, setUploadForm] = useState({
    requirementId: "",
    title: "",
    description: "",
    evidenceType: "DOCUMENT" as EvidenceType,
    collectionDate: new Date().toISOString().split("T")[0],
    expirationDate: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: evidence, isLoading } = useComplianceEvidence(filters);
  const { data: requirements } = useComplianceRequirements({});

  const uploadEvidence = useUploadEvidence();
  const verifyEvidence = useVerifyEvidence();
  const deleteEvidence = useDeleteEvidence();

  const handleSubmitEvidence = () => {
    if (!uploadForm.requirementId || !uploadForm.title || !selectedFile) return;

    uploadEvidence.mutate(
      {
        request: {
          requirementId: uploadForm.requirementId,
          title: uploadForm.title,
          description: uploadForm.description,
          evidenceType: uploadForm.evidenceType,
          collectionDate: uploadForm.collectionDate,
          expirationDate: uploadForm.expirationDate || undefined,
        },
        file: selectedFile,
      },
      {
        onSuccess: () => {
          setUploadDialogOpen(false);
          setSelectedFile(null);
          setUploadForm({
            requirementId: "",
            title: "",
            description: "",
            evidenceType: "DOCUMENT",
            collectionDate: new Date().toISOString().split("T")[0],
            expirationDate: "",
          });
        },
      }
    );
  };

  const columns = getEvidenceColumns({
    locale,
    onVerify: (e) => verifyEvidence.mutate(e.id),
    onDelete: (e) => deleteEvidence.mutate(e.id),
    onDownload: (e) => {
      if (e.fileUrl) window.open(e.fileUrl, "_blank");
    },
  });

  // Stats
  const evidenceList = evidence?.content ?? [];
  const totalEvidence = evidenceList.length;
  const verifiedCount = evidenceList.filter((e) => e.verified).length;
  const expiredCount = evidenceList.filter((e) => e.isExpired).length;
  const pendingCount = totalEvidence - verifiedCount - expiredCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isArabic ? "إدارة الأدلة" : "Evidence Management"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic
              ? "رفع وإدارة أدلة الامتثال للضوابط"
              : "Upload and manage compliance evidence for controls"}
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isArabic ? "رفع دليل" : "Upload Evidence"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isArabic ? "رفع دليل جديد" : "Upload New Evidence"}</DialogTitle>
              <DialogDescription>
                {isArabic
                  ? "رفع مستند أو دليل لدعم الامتثال"
                  : "Upload a document or evidence to support compliance"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{isArabic ? "الضابط" : "Control"}</Label>
                <Select
                  value={uploadForm.requirementId}
                  onValueChange={(v) => setUploadForm({ ...uploadForm, requirementId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isArabic ? "اختر الضابط" : "Select control"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(requirements?.content ?? []).map((req) => (
                      <SelectItem key={req.id} value={req.id}>
                        {req.requirementCode} - {req.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "العنوان" : "Title"}</Label>
                <Input
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder={isArabic ? "عنوان الدليل" : "Evidence title"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "الوصف" : "Description"}</Label>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder={isArabic ? "وصف اختياري" : "Optional description"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "النوع" : "Type"}</Label>
                <Select
                  value={uploadForm.evidenceType}
                  onValueChange={(v) => setUploadForm({ ...uploadForm, evidenceType: v as EvidenceType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOCUMENT">{isArabic ? "مستند" : "Document"}</SelectItem>
                    <SelectItem value="SCREENSHOT">{isArabic ? "لقطة شاشة" : "Screenshot"}</SelectItem>
                    <SelectItem value="LOG">{isArabic ? "ملف سجل" : "Log File"}</SelectItem>
                    <SelectItem value="REPORT">{isArabic ? "تقرير" : "Report"}</SelectItem>
                    <SelectItem value="CERTIFICATE">{isArabic ? "شهادة" : "Certificate"}</SelectItem>
                    <SelectItem value="AUDIT_TRAIL">{isArabic ? "مسار التدقيق" : "Audit Trail"}</SelectItem>
                    <SelectItem value="CONFIGURATION">{isArabic ? "تكوين" : "Configuration"}</SelectItem>
                    <SelectItem value="OTHER">{isArabic ? "أخرى" : "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isArabic ? "تاريخ الجمع" : "Collection Date"}</Label>
                  <Input
                    type="date"
                    value={uploadForm.collectionDate}
                    onChange={(e) => setUploadForm({ ...uploadForm, collectionDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? "تاريخ الانتهاء" : "Expiration Date"}</Label>
                  <Input
                    type="date"
                    value={uploadForm.expirationDate}
                    onChange={(e) => setUploadForm({ ...uploadForm, expirationDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? "الملف" : "File"}</Label>
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                {isArabic ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleSubmitEvidence}
                disabled={!uploadForm.requirementId || !uploadForm.title || !selectedFile || uploadEvidence.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isArabic ? "رفع" : "Upload"}
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
              {isArabic ? "إجمالي الأدلة" : "Total Evidence"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalEvidence}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "موثق" : "Verified"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "في انتظار التحقق" : "Pending Verification"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "منتهي الصلاحية" : "Expired"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
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
              value={filters.evidenceType || "all"}
              onValueChange={(v) =>
                setFilters({ ...filters, evidenceType: v === "all" ? undefined : (v as EvidenceType) })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isArabic ? "النوع" : "Type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? "جميع الأنواع" : "All Types"}</SelectItem>
                <SelectItem value="DOCUMENT">{isArabic ? "مستند" : "Document"}</SelectItem>
                <SelectItem value="SCREENSHOT">{isArabic ? "لقطة شاشة" : "Screenshot"}</SelectItem>
                <SelectItem value="LOG">{isArabic ? "ملف سجل" : "Log File"}</SelectItem>
                <SelectItem value="REPORT">{isArabic ? "تقرير" : "Report"}</SelectItem>
                <SelectItem value="CERTIFICATE">{isArabic ? "شهادة" : "Certificate"}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.verified === undefined ? "all" : filters.verified ? "verified" : "pending"}
              onValueChange={(v) =>
                setFilters({
                  ...filters,
                  verified: v === "all" ? undefined : v === "verified",
                })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isArabic ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isArabic ? "جميع الحالات" : "All Statuses"}</SelectItem>
                <SelectItem value="verified">{isArabic ? "موثق" : "Verified"}</SelectItem>
                <SelectItem value="pending">{isArabic ? "في انتظار التحقق" : "Pending"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "قائمة الأدلة" : "Evidence List"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "جميع الأدلة المرفوعة للامتثال"
              : "All uploaded compliance evidence"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <DataTable
              columns={columns}
              data={evidenceList}
              searchKey="title"
              searchPlaceholder={isArabic ? "البحث عن الأدلة..." : "Search evidence..."}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
