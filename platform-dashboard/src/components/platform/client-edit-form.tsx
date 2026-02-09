import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client } from "@/types";
import type { OrganizationType } from "@/types/organization";

// Form validation schema
const editClientSchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().optional(),
  tradeNameEn: z.string().optional(),
  tradeNameAr: z.string().optional(),
  organizationType: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  vatRegistrationNumber: z.string().optional(),
  commercialRegistrationNumber: z.string().optional(),
});

type EditClientFormValues = z.infer<typeof editClientSchema>;

interface ClientEditFormProps {
  client: Client;
  onSubmit: (data: EditClientFormValues) => void;
  isLoading?: boolean;
}

const ORG_TYPES: { value: OrganizationType; labelEn: string; labelAr: string }[] = [
  { value: "LLC", labelEn: "LLC", labelAr: "\u0630.\u0645.\u0645" },
  { value: "SOLE_PROPRIETORSHIP", labelEn: "Sole Proprietorship", labelAr: "\u0645\u0624\u0633\u0633\u0629 \u0641\u0631\u062F\u064A\u0629" },
  { value: "PARTNERSHIP", labelEn: "Partnership", labelAr: "\u0634\u0631\u0627\u0643\u0629" },
  { value: "CORPORATION", labelEn: "Corporation", labelAr: "\u0634\u0631\u0643\u0629 \u0645\u0633\u0627\u0647\u0645\u0629" },
  { value: "OTHER", labelEn: "Other", labelAr: "\u0623\u062E\u0631\u0649" },
];

export function ClientEditForm({ client, onSubmit, isLoading }: ClientEditFormProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditClientFormValues>({
    resolver: zodResolver(editClientSchema),
    defaultValues: {
      nameEn: client.name.en || "",
      nameAr: client.name.ar || "",
      tradeNameEn: client.tradeName?.en || "",
      tradeNameAr: client.tradeName?.ar || "",
      organizationType: client.organizationType || "",
      email: client.email || "",
      phone: client.phone || "",
      website: client.website || "",
      vatRegistrationNumber: client.vatRegistrationNumber || "",
      commercialRegistrationNumber: client.commercialRegistrationNumber || "",
    },
  });

  const texts = {
    organizationDetails: locale === "ar" ? "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0645\u0646\u0638\u0645\u0629" : "Organization Details",
    organizationDesc:
      locale === "ar"
        ? "\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0644\u0644\u0639\u0645\u064A\u0644"
        : "Update basic client information",
    nameEn: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645 (\u0625\u0646\u062C\u0644\u064A\u0632\u064A)" : "Name (English)",
    nameAr: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645 (\u0639\u0631\u0628\u064A)" : "Name (Arabic)",
    tradeNameEn: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u062A\u062C\u0627\u0631\u064A (\u0625\u0646\u062C\u0644\u064A\u0632\u064A)" : "Trade Name (English)",
    tradeNameAr: locale === "ar" ? "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u062A\u062C\u0627\u0631\u064A (\u0639\u0631\u0628\u064A)" : "Trade Name (Arabic)",
    type: locale === "ar" ? "\u0627\u0644\u0646\u0648\u0639" : "Type",
    selectType: locale === "ar" ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u0646\u0648\u0639" : "Select type",
    contactInfo: locale === "ar" ? "\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644" : "Contact Information",
    contactDesc:
      locale === "ar"
        ? "\u062A\u062D\u062F\u064A\u062B \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644"
        : "Update contact details",
    email: locale === "ar" ? "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" : "Email",
    phone: locale === "ar" ? "\u0627\u0644\u0647\u0627\u062A\u0641" : "Phone",
    website: locale === "ar" ? "\u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" : "Website",
    registrationInfo: locale === "ar" ? "\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u062A\u0633\u062C\u064A\u0644" : "Registration Info",
    registrationDesc:
      locale === "ar"
        ? "\u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u062A\u0633\u062C\u064A\u0644\u064A\u0629 \u0648\u0627\u0644\u0636\u0631\u064A\u0628\u064A\u0629"
        : "Tax and registration numbers",
    vatNumber: locale === "ar" ? "\u0631\u0642\u0645 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u0636\u0631\u064A\u0628\u064A" : "VAT Registration Number",
    crNumber: locale === "ar" ? "\u0631\u0642\u0645 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u062A\u062C\u0627\u0631\u064A" : "Commercial Registration Number",
    submit: locale === "ar" ? "\u062D\u0641\u0638 \u0627\u0644\u062A\u063A\u064A\u064A\u0631\u0627\u062A" : "Save Changes",
    submitting: locale === "ar" ? "\u062C\u0627\u0631\u064A \u0627\u0644\u062D\u0641\u0638..." : "Saving...",
  };

  const watchOrgType = watch("organizationType");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {texts.organizationDetails}
          </CardTitle>
          <CardDescription>{texts.organizationDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameEn">{texts.nameEn} *</Label>
              <Input id="nameEn" {...register("nameEn")} />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">{texts.nameAr}</Label>
              <Input id="nameAr" {...register("nameAr")} dir="rtl" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tradeNameEn">{texts.tradeNameEn}</Label>
              <Input id="tradeNameEn" {...register("tradeNameEn")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tradeNameAr">{texts.tradeNameAr}</Label>
              <Input id="tradeNameAr" {...register("tradeNameAr")} dir="rtl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{texts.type}</Label>
            <Select
              value={watchOrgType}
              onValueChange={(value) => setValue("organizationType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={texts.selectType} />
              </SelectTrigger>
              <SelectContent>
                {ORG_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {locale === "ar" ? type.labelAr : type.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.contactInfo}</CardTitle>
          <CardDescription>{texts.contactDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{texts.email}</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{texts.phone}</Label>
              <Input id="phone" type="tel" {...register("phone")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">{texts.website}</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://"
              {...register("website")}
            />
            {errors.website && (
              <p className="text-sm text-destructive">{errors.website.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registration Info */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.registrationInfo}</CardTitle>
          <CardDescription>{texts.registrationDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vatRegistrationNumber">{texts.vatNumber}</Label>
              <Input id="vatRegistrationNumber" {...register("vatRegistrationNumber")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commercialRegistrationNumber">{texts.crNumber}</Label>
              <Input
                id="commercialRegistrationNumber"
                {...register("commercialRegistrationNumber")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? texts.submitting : texts.submit}
        </Button>
      </div>
    </form>
  );
}

export type { EditClientFormValues };
