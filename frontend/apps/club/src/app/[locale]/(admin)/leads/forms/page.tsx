"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Plus,
  FileText,
  Copy,
  Eye,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@liyaqa/shared/components/page-header";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Input } from "@liyaqa/shared/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@liyaqa/shared/components/ui/dropdown-menu";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useLeadCaptureForms,
  useActivateLeadCaptureForm,
  useDeactivateLeadCaptureForm,
  useDeleteLeadCaptureForm,
} from "@liyaqa/shared/queries/use-lead-capture-forms";
import type { LeadCaptureForm } from "@liyaqa/shared/types/lead-capture-form";

export default function LeadCaptureFormsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useLeadCaptureForms({ search: search || undefined });
  const activateMutation = useActivateLeadCaptureForm();
  const deactivateMutation = useDeactivateLeadCaptureForm();
  const deleteMutation = useDeleteLeadCaptureForm();

  const forms = data?.content || [];

  const handleCopyEmbedCode = (form: LeadCaptureForm) => {
    const embedCode = `<iframe src="${window.location.origin}/forms/${form.slug}" width="100%" height="600" frameborder="0" style="border: none; max-width: 500px;"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast({
      title: isArabic ? "تم النسخ" : "Copied",
      description: isArabic
        ? "تم نسخ كود التضمين إلى الحافظة"
        : "Embed code copied to clipboard",
    });
  };

  const handleToggleActive = async (form: LeadCaptureForm) => {
    try {
      if (form.isActive) {
        await deactivateMutation.mutateAsync(form.id);
        toast({
          title: isArabic ? "تم التعطيل" : "Deactivated",
          description: isArabic
            ? "تم تعطيل النموذج بنجاح"
            : "Form deactivated successfully",
        });
      } else {
        await activateMutation.mutateAsync(form.id);
        toast({
          title: isArabic ? "تم التفعيل" : "Activated",
          description: isArabic
            ? "تم تفعيل النموذج بنجاح"
            : "Form activated successfully",
        });
      }
    } catch {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic
          ? "حدث خطأ أثناء تحديث النموذج"
          : "Failed to update form status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (form: LeadCaptureForm) => {
    if (
      !confirm(
        isArabic
          ? "هل أنت متأكد من حذف هذا النموذج؟"
          : "Are you sure you want to delete this form?"
      )
    ) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(form.id);
      toast({
        title: isArabic ? "تم الحذف" : "Deleted",
        description: isArabic
          ? "تم حذف النموذج بنجاح"
          : "Form deleted successfully",
      });
    } catch {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic
          ? "حدث خطأ أثناء حذف النموذج"
          : "Failed to delete form",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isArabic ? "نماذج التقاط العملاء" : "Lead Capture Forms"}
        description={
          isArabic
            ? "إنشاء وإدارة نماذج التقاط العملاء المحتملين"
            : "Create and manage embeddable lead capture forms"
        }
      >
        <Button asChild>
          <Link href={`/${locale}/leads/forms/new`}>
            <Plus className="me-2 h-4 w-4" />
            {isArabic ? "نموذج جديد" : "New Form"}
          </Link>
        </Button>
      </PageHeader>

      <div className="flex items-center gap-4">
        <Input
          placeholder={isArabic ? "بحث في النماذج..." : "Search forms..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {forms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              {isArabic ? "لا توجد نماذج" : "No forms yet"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {isArabic
                ? "أنشئ نموذج التقاط عملاء لجمع العملاء المحتملين من موقعك"
                : "Create a lead capture form to collect leads from your website"}
            </p>
            <Button asChild>
              <Link href={`/${locale}/leads/forms/new`}>
                <Plus className="me-2 h-4 w-4" />
                {isArabic ? "إنشاء أول نموذج" : "Create First Form"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card key={form.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{form.name}</CardTitle>
                    <CardDescription className="text-xs font-mono">
                      /{form.slug}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/leads/forms/${form.id}`}>
                          <Eye className="me-2 h-4 w-4" />
                          {isArabic ? "عرض" : "View"}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/leads/forms/${form.id}/edit`}>
                          <Pencil className="me-2 h-4 w-4" />
                          {isArabic ? "تعديل" : "Edit"}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyEmbedCode(form)}>
                        <Copy className="me-2 h-4 w-4" />
                        {isArabic ? "نسخ كود التضمين" : "Copy Embed Code"}
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a
                          href={`/forms/${form.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="me-2 h-4 w-4" />
                          {isArabic ? "معاينة" : "Preview"}
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleActive(form)}>
                        {form.isActive ? (
                          <>
                            <PowerOff className="me-2 h-4 w-4" />
                            {isArabic ? "تعطيل" : "Deactivate"}
                          </>
                        ) : (
                          <>
                            <Power className="me-2 h-4 w-4" />
                            {isArabic ? "تفعيل" : "Activate"}
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(form)}
                        className="text-destructive"
                      >
                        <Trash2 className="me-2 h-4 w-4" />
                        {isArabic ? "حذف" : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={form.isActive ? "default" : "secondary"}>
                      {form.isActive
                        ? isArabic
                          ? "نشط"
                          : "Active"
                        : isArabic
                        ? "غير نشط"
                        : "Inactive"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {form.config.fields.length}{" "}
                      {isArabic ? "حقول" : "fields"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isArabic ? "الإرسالات" : "Submissions"}
                    </span>
                    <span className="font-medium">{form.submissionCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {isArabic ? "تم الإنشاء" : "Created"}
                    </span>
                    <span>{formatDate(form.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
