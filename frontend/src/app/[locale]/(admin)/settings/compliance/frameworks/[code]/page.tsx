"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, ExternalLink } from "lucide-react";
import { ComplianceScoreCard } from "@/components/compliance/compliance-score-card";
import { ControlChecklist } from "@/components/compliance/control-checklist";
import { DataTable } from "@/components/ui/data-table";
import { getEvidenceColumns } from "@/components/admin/evidence-columns";
import {
  useComplianceFramework,
  useFrameworkComplianceStatus,
  useControlsByFramework,
  useComplianceStats,
  useUpdateControlStatus,
  useComplianceEvidence,
  useUploadEvidence,
  useVerifyEvidence,
  useDeleteEvidence,
} from "@/queries/use-compliance";
import type { ControlStatus, EvidenceType } from "@/types/compliance";

export default function FrameworkDetailPage() {
  const locale = useLocale();
  const params = useParams();
  const code = params.code as string;
  const isArabic = locale === "ar";

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    evidenceType: "DOCUMENT" as EvidenceType,
    collectionDate: new Date().toISOString().split("T")[0],
    expirationDate: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: framework, isLoading: loadingFramework } = useComplianceFramework(code);
  const { data: status } = useFrameworkComplianceStatus(code);
  const { data: controls, isLoading: loadingControls } = useControlsByFramework(code);
  const { data: stats, isLoading: loadingStats } = useComplianceStats(code);
  const { data: evidence, isLoading: loadingEvidence } = useComplianceEvidence({});

  const updateControlStatus = useUpdateControlStatus();
  const uploadEvidence = useUploadEvidence();
  const verifyEvidence = useVerifyEvidence();
  const deleteEvidence = useDeleteEvidence();

  const handleStatusChange = (controlId: string, newStatus: ControlStatus) => {
    updateControlStatus.mutate({
      id: controlId,
      request: { status: newStatus },
    });
  };

  const handleUploadEvidence = (requirementId: string) => {
    setSelectedRequirementId(requirementId);
    setUploadDialogOpen(true);
  };

  const handleSubmitEvidence = () => {
    if (!selectedRequirementId || !selectedFile) return;

    uploadEvidence.mutate(
      {
        request: {
          requirementId: selectedRequirementId,
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

  const evidenceColumns = getEvidenceColumns({
    locale,
    onVerify: (e) => verifyEvidence.mutate(e.id),
    onDelete: (e) => deleteEvidence.mutate(e.id),
    onDownload: (e) => {
      if (e.fileUrl) window.open(e.fileUrl, "_blank");
    },
  });

  if (loadingFramework) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!framework) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {isArabic ? "الإطار غير موجود" : "Framework not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isArabic && framework.nameAr ? framework.nameAr : framework.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{framework.code}</Badge>
            {framework.version && <Badge variant="secondary">v{framework.version}</Badge>}
          </div>
          {framework.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {isArabic && framework.descriptionAr
                ? framework.descriptionAr
                : framework.description}
            </p>
          )}
        </div>
        {framework.websiteUrl && (
          <Button variant="outline" asChild>
            <a href={framework.websiteUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              {isArabic ? "الموقع الرسمي" : "Official Website"}
            </a>
          </Button>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <ComplianceScoreCard
          title={isArabic ? "نتيجة الامتثال" : "Compliance Score"}
          score={status?.complianceScore ?? 0}
          isArabic={isArabic}
        />
        {loadingStats ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "الضوابط المنفذة" : "Implemented"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.implementedCount ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? "من" : "of"} {stats?.totalRequirements ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "قيد التنفيذ" : "In Progress"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats?.inProgressCount ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "لم يبدأ" : "Not Started"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-600">
                  {stats?.notImplementedCount ?? 0}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="controls" className="space-y-4">
        <TabsList>
          <TabsTrigger value="controls">
            {isArabic ? "الضوابط" : "Controls"}
          </TabsTrigger>
          <TabsTrigger value="evidence">
            {isArabic ? "الأدلة" : "Evidence"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? "الضوابط والمتطلبات" : "Controls & Requirements"}</CardTitle>
              <CardDescription>
                {isArabic
                  ? "تتبع تنفيذ متطلبات الإطار"
                  : "Track implementation of framework requirements"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingControls ? (
                <Skeleton className="h-64" />
              ) : (
                <ControlChecklist
                  controls={controls ?? []}
                  isArabic={isArabic}
                  onStatusChange={handleStatusChange}
                  onUploadEvidence={handleUploadEvidence}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? "أدلة الامتثال" : "Compliance Evidence"}</CardTitle>
              <CardDescription>
                {isArabic
                  ? "المستندات والأدلة الداعمة للامتثال"
                  : "Supporting documentation and evidence for compliance"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEvidence ? (
                <Skeleton className="h-64" />
              ) : (
                <DataTable
                  columns={evidenceColumns}
                  data={evidence?.content ?? []}
                  searchKey="title"
                  searchPlaceholder={isArabic ? "البحث عن الأدلة..." : "Search evidence..."}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Evidence Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArabic ? "رفع دليل" : "Upload Evidence"}</DialogTitle>
            <DialogDescription>
              {isArabic
                ? "رفع مستند أو دليل لدعم الامتثال"
                : "Upload a document or evidence to support compliance"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
              disabled={!uploadForm.title || !selectedFile || uploadEvidence.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isArabic ? "رفع" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
