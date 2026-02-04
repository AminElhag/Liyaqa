import { z } from "zod";

export const certificationSchema = z.object({
  nameEn: z.string().min(1, "English name is required").max(200, "Name is too long"),
  nameAr: z.string().min(1, "Arabic name is required").max(200, "Name is too long"),
  issuingOrganization: z
    .string()
    .min(1, "Issuing organization is required")
    .max(200, "Organization name is too long"),
  issuedDate: z.string().optional(),
  expiryDate: z.string().optional(),
  certificateNumber: z.string().max(100, "Certificate number is too long").optional(),
  certificateFileUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
}).refine(
  (data) => {
    // If both dates are provided, ensure expiry is after issued date
    if (data.issuedDate && data.expiryDate) {
      return new Date(data.expiryDate) > new Date(data.issuedDate);
    }
    return true;
  },
  {
    message: "Expiry date must be after issued date",
    path: ["expiryDate"],
  }
);

export type CertificationFormValues = z.infer<typeof certificationSchema>;
