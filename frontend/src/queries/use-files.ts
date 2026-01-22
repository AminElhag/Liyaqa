"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadFile,
  uploadMemberPhoto,
  uploadInvoiceReceipt,
  deleteFile,
} from "@/lib/api/files";
import type { UUID } from "@/types/api";
import type { FileCategory } from "@/types/files";
import { memberKeys } from "./use-members";

export const fileKeys = {
  all: ["files"] as const,
};

/**
 * Hook to upload a file
 */
export function useUploadFile() {
  return useMutation({
    mutationFn: ({
      file,
      category,
      referenceId,
    }: {
      file: File;
      category?: FileCategory;
      referenceId?: UUID;
    }) => uploadFile(file, category, referenceId),
  });
}

/**
 * Hook to upload a member profile photo
 */
export function useUploadMemberPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, file }: { memberId: UUID; file: File }) =>
      uploadMemberPhoto(memberId, file),
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(memberId) });
    },
  });
}

/**
 * Hook to upload an invoice receipt
 */
export function useUploadInvoiceReceipt() {
  return useMutation({
    mutationFn: ({ invoiceId, file }: { invoiceId: UUID; file: File }) =>
      uploadInvoiceReceipt(invoiceId, file),
  });
}

/**
 * Hook to delete a file
 */
export function useDeleteFile() {
  return useMutation({
    mutationFn: (fileId: UUID) => deleteFile(fileId),
  });
}
