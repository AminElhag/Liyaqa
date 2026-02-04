"use client";

import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { Upload, X, FileIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number; // in bytes
  disabled?: boolean;
  preview?: string | null;
  className?: string;
  locale?: string;
}

const texts = {
  en: {
    dropzone: "Drag and drop a file here, or click to select",
    maxSize: "Max file size:",
    remove: "Remove",
  },
  ar: {
    dropzone: "اسحب وأفلت ملفًا هنا، أو انقر للتحديد",
    maxSize: "الحد الأقصى لحجم الملف:",
    remove: "إزالة",
  },
};

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  preview = null,
  className,
  locale = "en",
}: FileUploadProps) {
  const t = texts[locale === "ar" ? "ar" : "en"];
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.size <= maxSize) {
        onFileSelect(file);
      }
    },
    [maxSize, onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (disabled) return;

      const file = e.dataTransfer.files?.[0];
      if (file && file.size <= maxSize) {
        onFileSelect(file);
      }
    },
    [disabled, maxSize, onFileSelect]
  );

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  if (preview) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative rounded-lg border overflow-hidden">
          {preview.startsWith("data:image") || preview.includes("/api/files/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-neutral-100">
              <FileIcon className="h-12 w-12 text-neutral-400" />
            </div>
          )}
        </div>
        {onFileRemove && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 end-2"
            onClick={onFileRemove}
          >
            <X className="h-4 w-4 me-1" />
            {t.remove}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-neutral-300 hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 rounded-full bg-neutral-100">
          <Upload className="h-6 w-6 text-neutral-500" />
        </div>
        <p className="text-sm text-neutral-600">{t.dropzone}</p>
        <p className="text-xs text-neutral-400">
          {t.maxSize} {formatSize(maxSize)}
        </p>
      </div>
    </div>
  );
}
