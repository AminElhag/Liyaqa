import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateClientNote, useUpdateClientNote } from "@/hooks/use-client-notes";
import { useToast } from "@/stores/toast-store";
import { NOTE_CATEGORIES, type ClientNote, type NoteCategory } from "@/types/client-note";

const noteFormSchema = z.object({
  contentEn: z.string().min(1, "Content is required"),
  contentAr: z.string().optional(),
  category: z.enum(["GENERAL", "TECHNICAL", "BILLING", "RELATIONSHIP", "TROUBLESHOOTING"]),
  isPinned: z.boolean().default(false),
});

type NoteFormValues = {
  contentEn: string;
  contentAr?: string;
  category: "GENERAL" | "TECHNICAL" | "BILLING" | "RELATIONSHIP" | "TROUBLESHOOTING";
  isPinned: boolean;
};

interface ClientNoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  note?: ClientNote | null;
}

export function ClientNoteForm({ open, onOpenChange, organizationId, note }: ClientNoteFormProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const toast = useToast();
  const isEditing = !!note;

  const createNote = useCreateClientNote();
  const updateNote = useUpdateClientNote();

  const texts = {
    createTitle: locale === "ar" ? "\u0625\u0636\u0627\u0641\u0629 \u0645\u0644\u0627\u062D\u0638\u0629" : "Add Note",
    editTitle: locale === "ar" ? "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629" : "Edit Note",
    createDesc: locale === "ar" ? "\u0623\u0636\u0641 \u0645\u0644\u0627\u062D\u0638\u0629 \u062C\u062F\u064A\u062F\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u064A\u0644" : "Add a new note for this client",
    editDesc: locale === "ar" ? "\u0639\u062F\u0651\u0644 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629" : "Edit the note content",
    contentEn: locale === "ar" ? "\u0627\u0644\u0645\u062D\u062A\u0648\u0649 (\u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629)" : "Content (English)",
    contentAr: locale === "ar" ? "\u0627\u0644\u0645\u062D\u062A\u0648\u0649 (\u0627\u0644\u0639\u0631\u0628\u064A\u0629)" : "Content (Arabic)",
    category: locale === "ar" ? "\u0627\u0644\u0641\u0626\u0629" : "Category",
    selectCategory: locale === "ar" ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u0641\u0626\u0629" : "Select category",
    pinNote: locale === "ar" ? "\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629" : "Pin Note",
    pinDesc: locale === "ar" ? "\u0633\u062A\u0638\u0647\u0631 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629 \u0627\u0644\u0645\u062B\u0628\u062A\u0629 \u0641\u064A \u0627\u0644\u0623\u0639\u0644\u0649" : "Pinned notes appear at the top",
    cancel: locale === "ar" ? "\u0625\u0644\u063A\u0627\u0621" : "Cancel",
    create: locale === "ar" ? "\u0625\u0636\u0627\u0641\u0629" : "Add",
    save: locale === "ar" ? "\u062D\u0641\u0638" : "Save",
    createdDesc: locale === "ar" ? "\u062A\u0645 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629" : "Note added successfully",
    updatedDesc: locale === "ar" ? "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629" : "Note updated successfully",
    errorDesc: locale === "ar" ? "\u062D\u062F\u062B \u062E\u0637\u0623" : "An error occurred",
    required: locale === "ar" ? "\u0647\u0630\u0627 \u0627\u0644\u062D\u0642\u0644 \u0645\u0637\u0644\u0648\u0628" : "This field is required",
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<NoteFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(noteFormSchema) as any,
    defaultValues: {
      contentEn: "",
      contentAr: "",
      category: "GENERAL",
      isPinned: false,
    },
  });

  // Reset form when note changes
  useEffect(() => {
    if (note) {
      reset({
        contentEn: note.content.en || "",
        contentAr: note.content.ar || "",
        category: note.category,
        isPinned: note.isPinned,
      });
    } else {
      reset({
        contentEn: "",
        contentAr: "",
        category: "GENERAL",
        isPinned: false,
      });
    }
  }, [note, reset]);

  const onSubmit = (values: NoteFormValues) => {
    if (isEditing && note) {
      updateNote.mutate(
        {
          organizationId,
          noteId: note.id,
          data: {
            contentEn: values.contentEn,
            contentAr: values.contentAr || undefined,
            category: values.category,
            isPinned: values.isPinned,
          },
        },
        {
          onSuccess: () => {
            toast.success(texts.updatedDesc);
            onOpenChange(false);
            reset();
          },
          onError: () => {
            toast.error(texts.errorDesc);
          },
        }
      );
    } else {
      createNote.mutate(
        {
          organizationId,
          data: {
            contentEn: values.contentEn,
            contentAr: values.contentAr || undefined,
            category: values.category,
            isPinned: values.isPinned,
          },
        },
        {
          onSuccess: () => {
            toast.success(texts.createdDesc);
            onOpenChange(false);
            reset();
          },
          onError: () => {
            toast.error(texts.errorDesc);
          },
        }
      );
    }
  };

  const isPending = createNote.isPending || updateNote.isPending;
  const selectedCategory = watch("category");
  const isPinned = watch("isPinned");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? texts.editTitle : texts.createTitle}</DialogTitle>
          <DialogDescription>{isEditing ? texts.editDesc : texts.createDesc}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Content (English) */}
          <div className="space-y-2">
            <Label htmlFor="contentEn">{texts.contentEn}</Label>
            <Textarea
              id="contentEn"
              {...register("contentEn")}
              rows={4}
              placeholder={locale === "ar" ? "\u0623\u062F\u062E\u0644 \u0627\u0644\u0645\u062D\u062A\u0648\u0649..." : "Enter content..."}
            />
            {errors.contentEn && (
              <p className="text-sm text-destructive">{texts.required}</p>
            )}
          </div>

          {/* Content (Arabic) */}
          <div className="space-y-2">
            <Label htmlFor="contentAr">{texts.contentAr}</Label>
            <Textarea
              id="contentAr"
              {...register("contentAr")}
              rows={4}
              dir="rtl"
              placeholder={locale === "ar" ? "\u0623\u062F\u062E\u0644 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)..." : "Enter Arabic content (optional)..."}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">{texts.category}</Label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setValue("category", value as NoteCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder={texts.selectCategory} />
              </SelectTrigger>
              <SelectContent>
                {NOTE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {locale === "ar" ? cat.labelAr : cat.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pin Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="isPinned">{texts.pinNote}</Label>
              <p className="text-xs text-muted-foreground">{texts.pinDesc}</p>
            </div>
            <Switch
              id="isPinned"
              checked={isPinned}
              onCheckedChange={(checked) => setValue("isPinned", checked)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {texts.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "..." : isEditing ? texts.save : texts.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
