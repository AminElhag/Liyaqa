import { useTranslation } from "react-i18next";
import { useState } from "react";
import { StickyNote, Plus, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/feedback";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClientNotes } from "@/hooks/use-client-notes";
import { ClientNoteCard } from "./client-note-card";
import { ClientNoteForm } from "./client-note-form";
import { NOTE_CATEGORIES, type ClientNote, type NoteCategory } from "@/types/client-note";

interface ClientNotesTabProps {
  organizationId: string;
}

export function ClientNotesTab({ organizationId }: ClientNotesTabProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
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
    title: locale === "ar" ? "\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0639\u0645\u064A\u0644" : "Client Notes",
    addNote: locale === "ar" ? "\u0625\u0636\u0627\u0641\u0629 \u0645\u0644\u0627\u062D\u0638\u0629" : "Add Note",
    filterByCategory: locale === "ar" ? "\u062A\u0635\u0641\u064A\u0629 \u062D\u0633\u0628 \u0627\u0644\u0641\u0626\u0629" : "Filter by category",
    allCategories: locale === "ar" ? "\u062C\u0645\u064A\u0639 \u0627\u0644\u0641\u0626\u0627\u062A" : "All Categories",
    noNotes: locale === "ar" ? "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0644\u0627\u062D\u0638\u0627\u062A" : "No notes found",
    noNotesDesc: locale === "ar"
      ? "\u0623\u0636\u0641 \u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0644\u062A\u062A\u0628\u0639 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0645\u0647\u0645\u0629 \u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u064A\u0644"
      : "Add notes to track important information about this client",
    errorLoading: locale === "ar" ? "\u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A" : "Error loading notes",
    loadMore: locale === "ar" ? "\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0632\u064A\u062F" : "Load More",
    previous: locale === "ar" ? "\u0627\u0644\u0633\u0627\u0628\u0642" : "Previous",
    showing: locale === "ar" ? "\u0639\u0631\u0636" : "Showing",
    of: locale === "ar" ? "\u0645\u0646" : "of",
    results: locale === "ar" ? "\u0646\u062A\u064A\u062C\u0629" : "results",
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
          <LoadingSkeleton variant="table" />
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
