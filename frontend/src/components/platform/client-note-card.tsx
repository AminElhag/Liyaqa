"use client";

import { useLocale } from "next-intl";
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
import { useDeleteClientNote, useToggleClientNotePin } from "@/queries/platform/use-client-notes";
import { useToast } from "@/hooks/use-toast";
import { formatDate, getLocalizedText } from "@/lib/utils";
import type { ClientNote } from "@/types/platform/client-note";

interface ClientNoteCardProps {
  note: ClientNote;
  organizationId: string;
  onEdit: (note: ClientNote) => void;
}

export function ClientNoteCard({ note, organizationId, onEdit }: ClientNoteCardProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteNote = useDeleteClientNote();
  const togglePin = useToggleClientNotePin();

  const texts = {
    edit: locale === "ar" ? "تعديل" : "Edit",
    delete: locale === "ar" ? "حذف" : "Delete",
    pin: locale === "ar" ? "تثبيت" : "Pin",
    unpin: locale === "ar" ? "إلغاء التثبيت" : "Unpin",
    deleteTitle: locale === "ar" ? "حذف الملاحظة" : "Delete Note",
    deleteDesc: locale === "ar"
      ? "هل أنت متأكد من حذف هذه الملاحظة؟ لا يمكن التراجع عن هذا الإجراء."
      : "Are you sure you want to delete this note? This action cannot be undone.",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    confirm: locale === "ar" ? "حذف" : "Delete",
    successTitle: locale === "ar" ? "تم بنجاح" : "Success",
    deletedDesc: locale === "ar" ? "تم حذف الملاحظة" : "Note deleted successfully",
    pinnedDesc: locale === "ar" ? "تم تثبيت الملاحظة" : "Note pinned",
    unpinnedDesc: locale === "ar" ? "تم إلغاء تثبيت الملاحظة" : "Note unpinned",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    errorDesc: locale === "ar" ? "حدث خطأ" : "An error occurred",
  };

  const handleDelete = () => {
    deleteNote.mutate(
      { organizationId, noteId: note.id },
      {
        onSuccess: () => {
          toast({ title: texts.successTitle, description: texts.deletedDesc });
          setShowDeleteDialog(false);
        },
        onError: () => {
          toast({ title: texts.errorTitle, description: texts.errorDesc, variant: "destructive" });
        },
      }
    );
  };

  const handleTogglePin = () => {
    togglePin.mutate(
      { organizationId, noteId: note.id },
      {
        onSuccess: (updatedNote) => {
          toast({
            title: texts.successTitle,
            description: updatedNote.isPinned ? texts.pinnedDesc : texts.unpinnedDesc,
          });
        },
        onError: () => {
          toast({ title: texts.errorTitle, description: texts.errorDesc, variant: "destructive" });
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
