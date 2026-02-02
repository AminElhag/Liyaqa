"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  certificationSchema,
  type CertificationFormValues,
} from "@/lib/validations/trainer-certification";
import type { TrainerCertificationResponse } from "@/types/trainer-portal";

interface CertificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CertificationFormValues) => void;
  certification?: TrainerCertificationResponse | null;
  isLoading?: boolean;
}

export function CertificationDialog({
  open,
  onOpenChange,
  onSubmit,
  certification,
  isLoading = false,
}: CertificationDialogProps) {
  const locale = useLocale();
  const isEditing = !!certification;

  const texts = {
    addTitle: locale === "ar" ? "إضافة شهادة جديدة" : "Add New Certification",
    editTitle: locale === "ar" ? "تعديل الشهادة" : "Edit Certification",
    addDescription:
      locale === "ar"
        ? "أضف شهادة جديدة إلى ملفك الشخصي"
        : "Add a new certification to your profile",
    editDescription:
      locale === "ar"
        ? "تحديث تفاصيل الشهادة"
        : "Update certification details",
    nameEn: locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)",
    nameAr: locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)",
    organization: locale === "ar" ? "الجهة المصدرة" : "Issuing Organization",
    issuedDate: locale === "ar" ? "تاريخ الإصدار" : "Issued Date",
    expiryDate: locale === "ar" ? "تاريخ الانتهاء" : "Expiry Date",
    certificateNumber: locale === "ar" ? "رقم الشهادة" : "Certificate Number",
    certificateUrl: locale === "ar" ? "رابط الشهادة" : "Certificate URL",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    save: locale === "ar" ? "حفظ" : "Save",
    add: locale === "ar" ? "إضافة" : "Add",
    optional: locale === "ar" ? "اختياري" : "Optional",
  };

  const form = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      nameEn: "",
      nameAr: "",
      issuingOrganization: "",
      issuedDate: "",
      expiryDate: "",
      certificateNumber: "",
      certificateFileUrl: "",
    },
  });

  // Reset form when certification changes or dialog opens
  useEffect(() => {
    if (open) {
      if (certification) {
        form.reset({
          nameEn: certification.nameEn,
          nameAr: certification.nameAr,
          issuingOrganization: certification.issuingOrganization,
          issuedDate: certification.issuedDate || "",
          expiryDate: certification.expiryDate || "",
          certificateNumber: certification.certificateNumber || "",
          certificateFileUrl: certification.certificateFileUrl || "",
        });
      } else {
        form.reset({
          nameEn: "",
          nameAr: "",
          issuingOrganization: "",
          issuedDate: "",
          expiryDate: "",
          certificateNumber: "",
          certificateFileUrl: "",
        });
      }
    }
  }, [open, certification, form]);

  const handleSubmit = (data: CertificationFormValues) => {
    // Clean up optional fields
    const cleanedData = {
      ...data,
      issuedDate: data.issuedDate || undefined,
      expiryDate: data.expiryDate || undefined,
      certificateNumber: data.certificateNumber || undefined,
      certificateFileUrl: data.certificateFileUrl || undefined,
    };
    onSubmit(cleanedData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? texts.editTitle : texts.addTitle}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? texts.editDescription : texts.addDescription}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Name (English) */}
              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{texts.nameEn}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CPR Certification" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name (Arabic) */}
              <FormField
                control={form.control}
                name="nameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{texts.nameAr}</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: شهادة الإنعاش القلبي" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Issuing Organization */}
            <FormField
              control={form.control}
              name="issuingOrganization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{texts.organization}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., American Heart Association" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Issued Date */}
              <FormField
                control={form.control}
                name="issuedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {texts.issuedDate} ({texts.optional})
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Expiry Date */}
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {texts.expiryDate} ({texts.optional})
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Certificate Number */}
            <FormField
              control={form.control}
              name="certificateNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {texts.certificateNumber} ({texts.optional})
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CPR-2024-12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Certificate URL */}
            <FormField
              control={form.control}
              name="certificateFileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {texts.certificateUrl} ({texts.optional})
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/certificate.pdf"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {texts.cancel}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {isEditing ? texts.save : texts.add}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
