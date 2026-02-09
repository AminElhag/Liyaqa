import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Pin, MoreVertical, Pencil, Trash2, PinOff, User, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NoteCategoryBadge } from "./note-category-badge";
import { useDeleteClientNote, useToggleClientNotePin } from "@/hooks/use-client-notes";
import { useToast } from "@/stores/toast-store";
import { formatDate, getLocalizedText } from "@/lib/utils";
import type { ClientNote } from "@/types/client-note";

interface ClientNoteCardProps {
  note: ClientNote;
  organizationId: string;
  onEdit: (note: ClientNote) => void;
}

export function ClientNoteCard({ note, organizationId, onEdit }: ClientNoteCardProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const toast = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteNote = useDeleteClientNote();
  const togglePin = useToggleClientNotePin();

  const texts = {
    edit: locale === "ar" ? "\u062A\u0639\u062F\u064A\u0644" : "Edit",
    delete: locale === "ar" ? "\u062D\u0630\u0641" : "Delete",
    pin: locale === "ar" ? "\u062A\u062B\u0628\u064A\u062A" : "Pin",
    unpin: locale === "ar" ? "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062A\u062B\u0628\u064A\u062A" : "Unpin",
    deleteTitle: locale === "ar" ? "\u062D\u0630\u0641 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629" : "Delete Note",
    deleteDesc: locale === "ar"
      ? "\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u062D\u0630\u0641 \u0647\u0630\u0647 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629\u061F \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u062A\u0631\u0627\u062C\u0639 \u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621."
      : "Are you sure you want to delete this note? This action cannot be undone.",
    cancel: locale === "ar" ? "\u0625\u0644\u063A\u0627\u0621" : "Cancel",
    confirm: locale === "ar" ? "\u062D\u0630\u0641" : "Delete",
    deletedDesc: locale === "ar" ? "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629" : "Note deleted successfully",
    pinnedDesc: locale === "ar" ? "\u062A\u0645 \u062A\u062B\u0628\u064A\u062A \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629" : "Note pinned",
    unpinnedDesc: locale === "ar" ? "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u062A\u062B\u0628\u064A\u062A \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629" : "Note unpinned",
    errorDesc: locale === "ar" ? "\u062D\u062F\u062B \u062E\u0637\u0623" : "An error occurred",
  };

  const handleDelete = () => {
    deleteNote.mutate(
      { organizationId, noteId: note.id },
      {
        onSuccess: () => {
          toast.success(texts.deletedDesc);
          setShowDeleteDialog(false);
        },
        onError: () => {
          toast.error(texts.errorDesc);
        },
      }
    );
  };

  const handleTogglePin = () => {
    togglePin.mutate(
      { organizationId, noteId: note.id },
      {
        onSuccess: (updatedNote) => {
          toast.success(updatedNote.isPinned ? texts.pinnedDesc : texts.unpinnedDesc);
        },
        onError: () => {
          toast.error(texts.errorDesc);
        },
      }
    );
  };

  return (
    <>
      <Card className={note.isPinned ? "border-teal-500/50 bg-teal-50/30" : ""}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              {/* Header with category and pin indicator */}
              <div className="flex items-center gap-2">
                <NoteCategoryBadge category={note.category} />
                {note.isPinned && (
                  <Pin className="h-4 w-4 text-teal-600 fill-teal-600" />
                )}
              </div>

              {/* Content */}
              <p className="text-sm whitespace-pre-wrap">
                {getLocalizedText(note.content, locale)}
              </p>

              {/* Footer with author and date */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {note.createdByName || "Unknown"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(note.createdAt, locale)}
                </span>
              </div>
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleTogglePin}>
                  {note.isPinned ? (
                    <>
                      <PinOff className="me-2 h-4 w-4" />
                      {texts.unpin}
                    </>
                  ) : (
                    <>
                      <Pin className="me-2 h-4 w-4" />
                      {texts.pin}
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(note)}>
                  <Pencil className="me-2 h-4 w-4" />
                  {texts.edit}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  {texts.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{texts.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{texts.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{texts.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteNote.isPending}
            >
              {texts.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
