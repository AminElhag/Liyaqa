"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Rocket, Loader2 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useProvisionTenant } from "@liyaqa/shared/queries/platform/use-tenants";

export default function NewTenantPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  // Form state — field names match backend ProvisionTenantRequest
  const [facilityName, setFacilityName] = useState("");
  const [facilityNameAr, setFacilityNameAr] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");

  // Mutation
  const provisionTenant = useProvisionTenant();

  const texts = {
    title: locale === "ar" ? "إنشاء مستأجر جديد" : "Provision New Tenant",
    description:
      locale === "ar"
        ? "إنشاء مستأجر جديد مع إعداد النطاق والمالك"
        : "Create a new tenant with domain and owner setup",
    back: locale === "ar" ? "العودة للمستأجرين" : "Back to Tenants",
    tenantDetails: locale === "ar" ? "تفاصيل المستأجر" : "Tenant Details",
    facilityName: locale === "ar" ? "اسم المنشأة (إنجليزي)" : "Facility Name (English)",
    facilityNamePlaceholder: locale === "ar" ? "مثال: نادي الرياضة" : "e.g. Sports Club",
    facilityNameAr: locale === "ar" ? "اسم المنشأة (عربي)" : "Facility Name (Arabic)",
    facilityNameArPlaceholder: locale === "ar" ? "مثال: نادي الرياضة" : "e.g. Arabic name",
    subdomain: locale === "ar" ? "النطاق الفرعي" : "Subdomain",
    subdomainPlaceholder: locale === "ar" ? "مثال: sports-club" : "e.g. sports-club",
    subdomainHelp:
      locale === "ar"
        ? "سيكون متاحاً على sports-club.liyaqa.com"
        : "Will be available at sports-club.liyaqa.com",
    contactInfo: locale === "ar" ? "معلومات الاتصال" : "Contact Information",
    contactEmail: locale === "ar" ? "البريد الإلكتروني للتواصل" : "Contact Email",
    contactEmailPlaceholder: locale === "ar" ? "owner@example.com" : "owner@example.com",
    contactPhone: locale === "ar" ? "رقم الهاتف" : "Contact Phone",
    contactPhonePlaceholder: locale === "ar" ? "+966 5x xxx xxxx" : "+966 5x xxx xxxx",
    businessDetails: locale === "ar" ? "تفاصيل العمل" : "Business Details",
    crNumber: locale === "ar" ? "رقم السجل التجاري" : "CR Number",
    crNumberPlaceholder: locale === "ar" ? "مثال: 1010xxxxxx" : "e.g. 1010xxxxxx",
    vatNumber: locale === "ar" ? "الرقم الضريبي" : "VAT Number",
    vatNumberPlaceholder: locale === "ar" ? "مثال: 3xxxxxxxxxx0003" : "e.g. 3xxxxxxxxxx0003",
    address: locale === "ar" ? "العنوان" : "Address",
    addressPlaceholder: locale === "ar" ? "عنوان المنشأة" : "Facility address",
    city: locale === "ar" ? "المدينة" : "City",
    cityPlaceholder: locale === "ar" ? "مثال: الرياض" : "e.g. Riyadh",
    region: locale === "ar" ? "المنطقة" : "Region",
    regionPlaceholder: locale === "ar" ? "مثال: منطقة الرياض" : "e.g. Riyadh Region",
    provision: locale === "ar" ? "إنشاء المستأجر" : "Provision Tenant",
    provisioning: locale === "ar" ? "جاري الإنشاء..." : "Provisioning...",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    successTitle: locale === "ar" ? "تم الإنشاء" : "Tenant Created",
    successDesc:
      locale === "ar"
        ? "تم إنشاء المستأجر بنجاح وجاري التجهيز"
        : "Tenant provisioned successfully",
    errorTitle: locale === "ar" ? "خطأ" : "Error",
    errorDesc:
      locale === "ar"
        ? "حدث خطأ أثناء إنشاء المستأجر"
        : "Error provisioning tenant",
    nameRequired:
      locale === "ar"
        ? "اسم المنشأة بالإنجليزية مطلوب"
        : "Facility name (English) is required",
    emailRequired:
      locale === "ar"
        ? "البريد الإلكتروني للتواصل مطلوب"
        : "Contact email is required",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!facilityName.trim()) {
      toast({ title: texts.errorTitle, description: texts.nameRequired, variant: "destructive" });
      return;
    }
    if (!contactEmail.trim()) {
      toast({ title: texts.errorTitle, description: texts.emailRequired, variant: "destructive" });
      return;
    }

    provisionTenant.mutate(
      {
        facilityName: facilityName.trim(),
        facilityNameAr: facilityNameAr.trim() || undefined,
        subdomain: subdomain.trim() || undefined,
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim() || undefined,
        crNumber: crNumber.trim() || undefined,
        vatNumber: vatNumber.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        region: region.trim() || undefined,
        country: "SA",
      },
      {
        onSuccess: (result) => {
          toast({
            title: texts.successTitle,
            description: texts.successDesc,
          });
          router.push(`/${locale}/tenants/${result.id}`);
        },
        onError: (err) => {
          toast({
            title: texts.errorTitle,
            description: err.message || texts.errorDesc,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/tenants`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">{texts.description}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tenant Details */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.tenantDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="facilityName">{texts.facilityName} *</Label>
                <Input
                  id="facilityName"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder={texts.facilityNamePlaceholder}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilityNameAr">{texts.facilityNameAr}</Label>
                <Input
                  id="facilityNameAr"
                  value={facilityNameAr}
                  onChange={(e) => setFacilityNameAr(e.target.value)}
                  placeholder={texts.facilityNameArPlaceholder}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">{texts.subdomain}</Label>
              <Input
                id="subdomain"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder={texts.subdomainPlaceholder}
              />
              <p className="text-xs text-muted-foreground">{texts.subdomainHelp}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.contactInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">{texts.contactEmail} *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder={texts.contactEmailPlaceholder}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">{texts.contactPhone}</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder={texts.contactPhonePlaceholder}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle>{texts.businessDetails}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="crNumber">{texts.crNumber}</Label>
                <Input
                  id="crNumber"
                  value={crNumber}
                  onChange={(e) => setCrNumber(e.target.value)}
                  placeholder={texts.crNumberPlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatNumber">{texts.vatNumber}</Label>
                <Input
                  id="vatNumber"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  placeholder={texts.vatNumberPlaceholder}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{texts.address}</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={texts.addressPlaceholder}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">{texts.city}</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={texts.cityPlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">{texts.region}</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder={texts.regionPlaceholder}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link href={`/${locale}/tenants`}>
              {texts.cancel}
            </Link>
          </Button>
          <Button type="submit" disabled={provisionTenant.isPending}>
            {provisionTenant.isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="me-2 h-4 w-4" />
            )}
            {provisionTenant.isPending ? texts.provisioning : texts.provision}
          </Button>
        </div>
      </form>
    </div>
  );
}
