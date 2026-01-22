"use client";

import { useState, useRef, useCallback } from "react";
import { useLocale } from "next-intl";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUploadMemberPhoto } from "@/queries/use-files";
import { useToast } from "@/hooks/use-toast";
import type { UUID } from "@/types/api";

interface PhotoUploadDialogProps {
  memberId: UUID;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PhotoUploadDialog({
  memberId,
  open,
  onOpenChange,
  onSuccess,
}: PhotoUploadDialogProps) {
  const locale = useLocale();
  const { toast } = useToast();
  const uploadPhoto = useUploadMemberPhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const texts = {
    title: locale === "ar" ? "تحميل صورة الملف الشخصي" : "Upload Profile Photo",
    description:
      locale === "ar"
        ? "اختر صورة لتحميلها كصورة الملف الشخصي للعضو"
        : "Select an image to upload as the member profile photo",
    dropzone:
      locale === "ar"
        ? "اسحب وأفلت الصورة هنا، أو انقر للاختيار"
        : "Drag and drop an image here, or click to select",
    supportedFormats:
      locale === "ar"
        ? "الصيغ المدعومة: JPG، PNG، GIF (الحد الأقصى 5 ميجابايت)"
        : "Supported formats: JPG, PNG, GIF (Max 5MB)",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    upload: locale === "ar" ? "تحميل" : "Upload",
    uploading: locale === "ar" ? "جاري التحميل..." : "Uploading...",
    successTitle: locale === "ar" ? "تم التحميل" : "Uploaded",
    successDesc:
      locale === "ar"
        ? "تم تحميل صورة الملف الشخصي بنجاح"
        : "Profile photo uploaded successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    invalidType:
      locale === "ar"
        ? "نوع الملف غير صالح. يرجى اختيار صورة."
        : "Invalid file type. Please select an image.",
    fileTooLarge:
      locale === "ar"
        ? "الملف كبير جداً. الحد الأقصى هو 5 ميجابايت."
        : "File is too large. Maximum size is 5MB.",
    removeImage: locale === "ar" ? "إزالة الصورة" : "Remove image",
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const validateFile = (file: File): string | null => {
    // Check type
    if (!file.type.startsWith("image/")) {
      return texts.invalidType;
    }
    // Check size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return texts.fileTooLarge;
    }
    return null;
  };

  const handleFile = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        title: texts.errorTitle,
        description: error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [texts]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadPhoto.mutateAsync({ memberId, file: selectedFile });
      toast({
        title: texts.successTitle,
        description: texts.successDesc,
      });
      handleClose();
      onSuccess?.();
    } catch (error) {
      toast({
        title: texts.errorTitle,
        description: error instanceof Error ? error.message : "Upload failed",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setIsDragOver(false);
    onOpenChange(false);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 end-2"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">{texts.removeImage}</span>
              </Button>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium">{texts.dropzone}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {texts.supportedFormats}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {texts.cancel}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadPhoto.isPending}
          >
            {uploadPhoto.isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {texts.uploading}
              </>
            ) : (
              texts.upload
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
