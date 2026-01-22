"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import { StickyNote, Plus, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClientNotes } from "@/queries/platform/use-client-notes";
import { ClientNoteCard } from "./client-note-card";
import { ClientNoteForm } from "./client-note-form";
import { NOTE_CATEGORIES, type ClientNote, type NoteCategory } from "@/types/platform/client-note";

interface ClientNotesTabProps {
  organizationId: string;
}

export function ClientNotesTab({ organizationId }: ClientNotesTabProps) {
  const locale = useLocale();
  const [page, setPage] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<NoteCategory | "all">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ClientNote | null>(null);

  const { data, isLoading, error } = useClientNotes(organizationId, {
    page,
    size: 10,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    sortBy: "isPinned,createdAt",
    sortDirection: "desc",
  });

  const texts = {
    title: locale === "ar" ? "ملاحظات العميل" : "Client Notes",
    addNote: locale === "ar" ? "إضافة ملاحظة" : "Add Note",
    filterByCategory: locale === "ar" ? "تصفية حسب الفئة" : "Filter by category",
    allCategories: locale === "ar" ? "جميع الفئات" : "All Categories",
    noNotes: locale === "ar" ? "لا توجد ملاحظات" : "No notes found",
    noNotesDesc: locale === "ar"
      ? "أضف ملاحظات لتتبع المعلومات المهمة عن هذا العميل"
      : "Add notes to track important information about this client",
    errorLoading: locale === "ar" ? "خطأ في تحميل الملاحظات" : "Error loading notes",
    loadMore: locale === "ar" ? "تحميل المزيد" : "Load More",
    previous: locale === "ar" ? "السابق" : "Previous",
    showing: locale === "ar" ? "عرض" : "Showing",
    of: locale === "ar" ? "من" : "of",
    results: locale === "ar" ? "نتيجة" : "results",
  };

  const handleEdit = (note: ClientNote) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingNote(null);
    }
  };

  if (isLoading && page === 0) {
    return (
      <Card className="border-teal-500/20">
        <CardContent className="py-10 flex justify-center">
          <Loading />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-teal-500/20">
        <CardContent className="py-6 text-center text-destructive">
          {texts.errorLoading}
        </CardContent>
      </Card>
    );
  }

  const notes = data?.content || [];
  const totalElements = data?.totalElements || 0;
  const totalPages = data?.totalPages || 0;

  // Separate pinned and unpinned notes
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const unpinnedNotes = notes.filter((n) => !n.isPinned);

  return (
    <>
      <Card className="border-teal-500/20">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-teal-600" />
              {texts.title}
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter */}
              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value as NoteCategory | "all");
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="me-2 h-4 w-4" />
                  <SelectValue placeholder={texts.filterByCategory} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{texts.allCategories}</SelectItem>
                  {NOTE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {locale === "ar" ? cat.labelAr : cat.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Add Button */}
              <Button size="sm" onClick={() => setIsFormOpen(true)}>
                <Plus className="me-2 h-4 w-4" />
                {texts.addNote}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="py-10 text-center">
              <StickyNote className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">{texts.noNotes}</p>
              <p className="text-sm text-muted-foreground mt-1">{texts.noNotesDesc}</p>
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="me-2 h-4 w-4" />
                {texts.addNote}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pinned Notes First */}
              {pinnedNotes.map((note) => (
                <ClientNoteCard
                  key={note.id}
                  note={note}
                  organizationId={organizationId}
                  onEdit={handleEdit}
                />
              ))}

              {/* Then Unpinned Notes */}
              {unpinnedNotes.map((note) => (
                <ClientNoteCard
                  key={note.id}
                  note={note}
                  organizationId={organizationId}
                  onEdit={handleEdit}
                />
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {texts.showing} {page * 10 + 1}-{Math.min((page + 1) * 10, totalElements)} {texts.of} {totalElements} {texts.results}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      {texts.previous}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      {texts.loadMore}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note Form Dialog */}
      <ClientNoteForm
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        organizationId={organizationId}
        note={editingNote}
      />
    </>
  );
}
