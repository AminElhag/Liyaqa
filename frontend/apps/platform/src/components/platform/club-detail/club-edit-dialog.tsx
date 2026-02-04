"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Edit } from "lucide-react";
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
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Label } from "@liyaqa/shared/components/ui/label";
import type { PlatformClubDetail, UpdateClubRequest } from "@liyaqa/shared/types/platform";

const editClubSchema = z.object({
  nameEn: z.string().min(1, "English name is required").max(100),
  nameAr: z.string().max(100).optional(),
  descriptionEn: z.string().max(500).optional(),
  descriptionAr: z.string().max(500).optional(),
});

type EditClubFormData = z.infer<typeof editClubSchema>;

interface ClubEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  club: PlatformClubDetail;
  locale: string;
  onSubmit: (data: UpdateClubRequest) => Promise<void>;
  isLoading?: boolean;
}

export function ClubEditDialog({
  open,
  onOpenChange,
  club,
  locale,
  onSubmit,
  isLoading = false,
}: ClubEditDialogProps) {
  const texts = {
    title: locale === "ar" ? "تعديل النادي" : "Edit Club",
    description: locale === "ar" ? "تعديل معلومات النادي الأساسية" : "Edit basic club information",
    nameEn: locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)",
    nameAr: locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)",
    descriptionEn: locale === "ar" ? "الوصف (إنجليزي)" : "Description (English)",
    descriptionAr: locale === "ar" ? "الوصف (عربي)" : "Description (Arabic)",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    save: locale === "ar" ? "حفظ" : "Save Changes",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
    optional: locale === "ar" ? "(اختياري)" : "(optional)",
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditClubFormData>({
    resolver: zodResolver(editClubSchema),
    defaultValues: {
      nameEn: club.name.en,
      nameAr: club.name.ar || "",
      descriptionEn: club.description?.en || "",
      descriptionAr: club.description?.ar || "",
    },
  });

  const handleFormSubmit = async (data: EditClubFormData) => {
    await onSubmit({
      nameEn: data.nameEn,
      nameAr: data.nameAr || undefined,
      descriptionEn: data.descriptionEn || undefined,
      descriptionAr: data.descriptionAr || undefined,
    });
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nameEn">{texts.nameEn}</Label>
              <Input
                id="nameEn"
                {...register("nameEn")}
                disabled={isLoading}
              />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameAr">
                {texts.nameAr} <span className="text-muted-foreground text-xs">{texts.optional}</span>
              </Label>
              <Input
                id="nameAr"
                dir="rtl"
                {...register("nameAr")}
                disabled={isLoading}
              />
              {errors.nameAr && (
                <p className="text-sm text-destructive">{errors.nameAr.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descriptionEn">
              {texts.descriptionEn} <span className="text-muted-foreground text-xs">{texts.optional}</span>
            </Label>
            <Textarea
              id="descriptionEn"
              rows={3}
              {...register("descriptionEn")}
              disabled={isLoading}
            />
            {errors.descriptionEn && (
              <p className="text-sm text-destructive">{errors.descriptionEn.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descriptionAr">
              {texts.descriptionAr} <span className="text-muted-foreground text-xs">{texts.optional}</span>
            </Label>
            <Textarea
              id="descriptionAr"
              rows={3}
              dir="rtl"
              {...register("descriptionAr")}
              disabled={isLoading}
            />
            {errors.descriptionAr && (
              <p className="text-sm text-destructive">{errors.descriptionAr.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              {texts.cancel}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {texts.saving}
                </>
              ) : (
                texts.save
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
