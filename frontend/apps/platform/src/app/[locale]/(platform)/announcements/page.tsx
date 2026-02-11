"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Plus, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { DataTable } from "@liyaqa/shared/components/ui/data-table";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import {
  useAnnouncements,
  usePublishAnnouncement,
  useArchiveAnnouncement,
} from "@liyaqa/shared/queries/platform/use-announcements";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import type { AnnouncementStatus } from "@liyaqa/shared/types/platform/announcements";
import type { ColumnDef } from "@tanstack/react-table";

export default function AnnouncementsPage() {
  const locale = useLocale();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | "ALL">("ALL");

  const { data, isLoading, error, refetch } = useAnnouncements({
    page,
    size: pageSize,
  });

  const publishMutation = usePublishAnnouncement();
  const archiveMutation = useArchiveAnnouncement();

  const canEdit = user?.role === "PLATFORM_ADMIN";

  const texts = {
    title: locale === "ar" ? "الإعلانات" : "Announcements",
    description: locale === "ar" ? "إدارة إعلانات المنصة للعملاء" : "Manage platform announcements for clients",
    newAnnouncement: locale === "ar" ? "إعلان جديد" : "New Announcement",
    status: locale === "ar" ? "الحالة" : "Status",
    all: locale === "ar" ? "الكل" : "All",
    draft: locale === "ar" ? "مسودة" : "Draft",
    published: locale === "ar" ? "منشور" : "Published",
    archived: locale === "ar" ? "مؤرشف" : "Archived",
    publish: locale === "ar" ? "نشر" : "Publish",
    archive: locale === "ar" ? "أرشفة" : "Archive",
  };

  const handlePublish = async (id: string) => {
    try {
      await publishMutation.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم" : "Success",
        description: locale === "ar" ? "تم نشر الإعلان" : "Announcement published",
      });
      refetch();
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveMutation.mutateAsync(id);
      toast({
        title: locale === "ar" ? "تم" : "Success",
        description: locale === "ar" ? "تم أرشفة الإعلان" : "Announcement archived",
      });
      refetch();
    } catch (error) {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: locale === "ar" ? "العنوان" : "Title",
      },
      {
        accessorKey: "type",
        header: locale === "ar" ? "النوع" : "Type",
      },
      {
        accessorKey: "status",
        header: locale === "ar" ? "الحالة" : "Status",
      },
      {
        accessorKey: "createdAt",
        header: locale === "ar" ? "تاريخ الإنشاء" : "Created At",
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(locale),
      },
      {
        id: "actions",
        header: locale === "ar" ? "الإجراءات" : "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.status === "DRAFT" && canEdit && (
              <Button size="sm" onClick={() => handlePublish(row.original.id)}>
                {texts.publish}
              </Button>
            )}
            {row.original.status === "PUBLISHED" && canEdit && (
              <Button size="sm" variant="outline" onClick={() => handleArchive(row.original.id)}>
                {texts.archive}
              </Button>
            )}
          </div>
        ),
      },
    ],
    [locale, canEdit, texts]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading text={locale === "ar" ? "جاري التحميل..." : "Loading..."} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive">
          {locale === "ar" ? "حدث خطأ في تحميل الإعلانات" : "Error loading announcements"}
        </p>
        <Button onClick={() => refetch()}>
          {locale === "ar" ? "إعادة المحاولة" : "Retry"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
        {canEdit && (
          <Button asChild>
            <Link href={`/${locale}/announcements/new`}>
              <Plus className="me-2 h-4 w-4" />
              {texts.newAnnouncement}
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as AnnouncementStatus | "ALL");
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={texts.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{texts.all}</SelectItem>
                <SelectItem value="DRAFT">{texts.draft}</SelectItem>
                <SelectItem value="PUBLISHED">{texts.published}</SelectItem>
                <SelectItem value="ARCHIVED">{texts.archived}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={data?.content || []}
            manualPagination
            pageCount={data?.totalPages || 1}
            pageIndex={page}
            pageSize={pageSize}
            totalRows={data?.totalElements}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
