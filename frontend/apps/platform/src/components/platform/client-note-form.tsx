"use client";

import { useLocale } from "next-intl";
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
} from "@liyaqa/shared/components/ui/dialog";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import { useCreateClientNote, useUpdateClientNote } from "@liyaqa/shared/queries/platform/use-client-notes";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { NOTE_CATEGORIES, type ClientNote, type NoteCategory } from "@liyaqa/shared/types/platform/client-note";

const noteFormSchema = z.object({
  contentEn: z.string().min(1, "Content is required"),
  contentAr: z.string().optional(),
  category: z.enum(["GENERAL", "TECHNICAL", "BILLING", "RELATIONSHIP", "TROUBLESHOOTING"]),
  isPinned: z.boolean().default(false),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface ClientNoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  note?: ClientNote | null;
}

export function ClientNoteForm({ open, onOpenChange, organizationId, note }: ClientNoteFormProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const isEditing = !!note;

  const createNote = useCreateClientNote();
  const updateNote = useUpdateClientNote();

  const texts = {
    createTitle: locale === "ar" ? "إضافة ملاحظة" : "Add Note",
    editTitle: locale === "ar" ? "تعديل الملاحظة" : "Edit Note",
    createDesc: locale === "ar" ? "أضف ملاحظة جديدة لهذا العميل" : "Add a new note for this client",
    editDesc: locale === "ar" ? "عدّل محتوى الملاحظة" : "Edit the note content",
    contentEn: locale === "ar" ? "المحتوى (الإنجليزية)" : "Content (English)",
    contentAr: locale === "ar" ? "المحتوى (العربية)" : "Content (Arabic)",
    category: locale === "ar" ? "الفئة" : "Category",
    selectCategory: locale === "ar" ? "اختر الفئة" : "Select category",
    pinNote: locale === "ar" ? "تثبيت الملاحظة" : "Pin Note",
    pinDesc: locale === "ar" ? "ستظهر الملاحظة المثبتة في الأعلى" : "Pinned notes appear at the top",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    create: locale === "ar" ? "إضافة" : "Add",
    save: locale === "ar" ? "حفظ" : "Save",
    successTitle: locale === "ar" ? "تم بنجاح" : "Success",
    createdDesc: locale === "ar" ? "تم إضافة الملاحظة" : "Note added successfully",
    updatedDesc: locale === "ar" ? "تم تحديث الملاحظة" : "Note updated successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    errorDesc: locale === "ar" ? "حدث خطأ" : "An error occurred",
    required: locale === "ar" ? "هذا الحقل مطلوب" : "This field is required",
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
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
            toast({ title: texts.successTitle, description: texts.updatedDesc });
            onOpenChange(false);
            reset();
          },
          onError: () => {
            toast({ title: texts.errorTitle, description: texts.errorDesc, variant: "destructive" });
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
            toast({ title: texts.successTitle, description: texts.createdDesc });
            onOpenChange(false);
            reset();
          },
          onError: () => {
            toast({ title: texts.errorTitle, description: texts.errorDesc, variant: "destructive" });
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
              placeholder={locale === "ar" ? "أدخل المحتوى..." : "Enter content..."}
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
              placeholder={locale === "ar" ? "أدخل المحتوى بالعربية (اختياري)..." : "Enter Arabic content (optional)..."}
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
